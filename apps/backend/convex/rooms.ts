/**
 * Rooms: an uploaded photo the user iterates on by leaving comments.
 *
 * Flow:
 *  1. `create` stores the upload as version 0 and schedules item detection.
 *  2. `addComment` records the request and schedules `roomsAi.applyComment`,
 *     which renders a new version and marks the comment applied.
 *  3. `roomsAi.searchItemProducts` lazily fetches Amazon products for an item.
 */
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { authComponent } from "./auth";
import { normalizeSearchQuery } from "./lib/amazonSearch";
import { type RoomType, vRoomStyle, vRoomType } from "./lib/roomTaxonomy";
import { privateMutation, privateQuery, publicQuery } from "./lib/utils";
import {
  vAnchor,
  vBox,
  vCommentStatus,
  vItemsStatus,
  vProduct,
  vRoomItem,
  vRoomStatus,
} from "./schema";

const MAX_COMMENT_LENGTH = 1000;
const MAX_TITLE_LENGTH = 120;

/** How much of a product's name fits in the comment that places it. */
const PRODUCT_NAME_MAX_LENGTH = 80;

/** Rooms on one gallery page, and the most a caller may ask for. */
const GALLERY_DEFAULT_LIMIT = 24;
const GALLERY_MAX_LIMIT = 60;

/**
 * How many listed rooms to read per page before filtering. A room only earns
 * a card once it has an edit to show, so more rows are read than handed back.
 */
const GALLERY_OVERFETCH = 3;

/** The most rows a whole-gallery scan (sitemap, counts) will ever touch. */
const GALLERY_SCAN_CAP = 5000;

/** A card needs a before and an after, which means at least two versions. */
const MIN_GALLERY_VERSIONS = 2;

/** How long a room made without an account is kept before it is deleted. */
const MS_PER_DAY = 86_400_000;
export const ANONYMOUS_ROOM_TTL_DAYS = 7;
const ANONYMOUS_ROOM_TTL_MS = ANONYMOUS_ROOM_TTL_DAYS * MS_PER_DAY;

/** Rooms deleted per purge run, so one cron tick cannot blow the time limit. */
const PURGE_BATCH_SIZE = 50;

/**
 * How long a cached Amazon search is served instead of a paid one, and how
 * long the row survives at all. Furniture listings move slowly; the search
 * behind them is the most expensive thing a session does.
 */
const PRODUCT_SEARCH_TTL_DAYS = 14;
const PRODUCT_SEARCH_TTL_MS = PRODUCT_SEARCH_TTL_DAYS * MS_PER_DAY;
const PRODUCT_SEARCH_MAX_AGE_DAYS = 30;
const PRODUCT_SEARCH_MAX_AGE_MS = PRODUCT_SEARCH_MAX_AGE_DAYS * MS_PER_DAY;

/** Cached searches dropped per prune tick. */
const PRODUCT_SEARCH_PRUNE_BATCH = 100;

const INVITE_TOKEN_BYTES = 24;

/** Someone with no name of their own, as everyone else in the room sees them. */
const GUEST_NAME = "Guest";

type Ctx = QueryCtx | MutationCtx;

/** Owner or invited editor. Only the owner can undo or hand out either. */
export const vRole = v.union(v.literal("owner"), v.literal("collaborator"));
type Role = "collaborator" | "owner";

async function getOwnedRoom(
  ctx: Ctx,
  userId: string,
  roomId: Id<"rooms">
): Promise<Doc<"rooms">> {
  const room = await ctx.db.get(roomId);
  if (!room || room.userId !== userId) {
    throw new Error("Room not found");
  }
  return room;
}

async function findMembership(ctx: Ctx, userId: string, roomId: Id<"rooms">) {
  return await ctx.db
    .query("roomMembers")
    .withIndex("by_room_and_user", (q) =>
      q.eq("roomId", roomId).eq("userId", userId)
    )
    .unique();
}

/** The room and how this person reaches it, or null when they cannot. */
async function findRoomAccess(
  ctx: Ctx,
  userId: string,
  roomId: Id<"rooms">
): Promise<{ role: Role; room: Doc<"rooms"> } | null> {
  const room = await ctx.db.get(roomId);
  if (!room) {
    return null;
  }
  if (room.userId === userId) {
    return { role: "owner", room };
  }
  const membership = await findMembership(ctx, userId, roomId);
  return membership ? { role: "collaborator", room } : null;
}

/**
 * A room this person may change: theirs, or one they were invited to edit.
 * Deleting, renaming and handing out access stay with the owner.
 */
async function getEditableRoom(
  ctx: Ctx,
  userId: string,
  roomId: Id<"rooms">
): Promise<Doc<"rooms">> {
  const access = await findRoomAccess(ctx, userId, roomId);
  if (!access) {
    throw new Error("Room not found");
  }
  return access.room;
}

/**
 * What to call someone in a room they share. Anonymous visitors are all
 * "Guest": the name Better Auth generates for them means nothing to anyone.
 */
function displayName(
  user: { isAnonymous?: boolean | null; name?: string | null } | null
): string {
  if (!user || user.isAnonymous) {
    return GUEST_NAME;
  }
  return user.name?.trim() || GUEST_NAME;
}

async function namesByUserId(
  ctx: Ctx,
  userIds: readonly string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)];
  const entries = await Promise.all(
    unique.map(async (id) => {
      const user = await authComponent.getAnyUserById(ctx, id);
      return [id, displayName(user)] as const;
    })
  );
  return new Map(entries);
}

const vVersionOut = v.object({
  _creationTime: v.number(),
  _id: v.id("roomVersions"),
  commentId: v.optional(v.id("roomComments")),
  imageUrl: v.union(v.string(), v.null()),
  items: v.array(vRoomItem),
  itemsStatus: vItemsStatus,
  summary: v.optional(v.string()),
});

const vCommentOut = v.object({
  _creationTime: v.number(),
  _id: v.id("roomComments"),
  anchor: v.optional(vAnchor),
  /** True when the room's owner wrote it, which is how the pin is coloured. */
  authorIsOwner: v.boolean(),
  authorName: v.optional(v.string()),
  baseVersionId: v.id("roomVersions"),
  error: v.optional(v.string()),
  /** The product this comment asked to put in the room, if it was a product. */
  product: v.optional(vProduct),
  resultVersionId: v.optional(v.id("roomVersions")),
  status: vCommentStatus,
  text: v.string(),
});

const vCollaboratorOut = v.object({ id: v.string(), name: v.string() });

/**
 * What a share link exposes. Deliberately narrower than the private shapes
 * above: no user ids, no internal error text, no storage ids.
 */
const vPublicItemOut = v.object({
  box: vBox,
  id: v.string(),
  label: v.string(),
  products: v.optional(v.array(vProduct)),
});

const vPublicVersionOut = v.object({
  _creationTime: v.number(),
  _id: v.id("roomVersions"),
  imageUrl: v.union(v.string(), v.null()),
  items: v.array(vPublicItemOut),
  summary: v.optional(v.string()),
});

const vPublicCommentOut = v.object({
  _creationTime: v.number(),
  _id: v.id("roomComments"),
  anchor: v.optional(vAnchor),
  baseVersionId: v.id("roomVersions"),
  product: v.optional(vProduct),
  resultVersionId: v.optional(v.id("roomVersions")),
  status: vCommentStatus,
  text: v.string(),
});

/**
 * Create a room from an uploaded photo. The upload becomes version 0 and
 * furniture detection is scheduled immediately so the photo is shoppable.
 */
export const create = privateMutation({
  args: {
    imageStorageId: v.id("_storage"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Nothing is gated behind sign-up, so a visitor's rooms are real rooms —
    // they just come with a clock on them until there is an account to keep
    // them in. Signing up clears this in `internalTransferOwnership`.
    const expiresAt = ctx.user.isAnonymous
      ? Date.now() + ANONYMOUS_ROOM_TTL_MS
      : undefined;

    const roomId = await ctx.db.insert("rooms", {
      expiresAt,
      originalImageStorageId: args.imageStorageId,
      status: "ready",
      title: args.title?.slice(0, MAX_TITLE_LENGTH),
      userId: ctx.userId,
    });

    const versionId = await ctx.db.insert("roomVersions", {
      imageStorageId: args.imageStorageId,
      itemsStatus: "pending",
      roomId,
      summary: "Original photo",
    });

    await ctx.db.patch(roomId, { currentVersionId: versionId });
    await ctx.scheduler.runAfter(0, internal.roomsAi.detectItems, {
      versionId,
    });

    return roomId;
  },
  returns: v.id("rooms"),
});

/**
 * Every room this person can open, newest first: the ones they made and the
 * ones they were invited to edit, which carry a badge saying so.
 */
export const list = privateQuery({
  args: {},
  handler: async (ctx) => {
    const owned = await ctx.db
      .query("rooms")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();
    const shared = (
      await Promise.all(
        memberships.map((membership) => ctx.db.get(membership.roomId))
      )
    ).filter((room): room is Doc<"rooms"> => room !== null);

    const rooms = [...owned, ...shared].sort(
      (a, b) => b._creationTime - a._creationTime
    );

    return await Promise.all(
      rooms.map(async (room) => {
        const current = room.currentVersionId
          ? await ctx.db.get(room.currentVersionId)
          : null;
        const storageId =
          current?.imageStorageId ?? room.originalImageStorageId;
        const versions = await ctx.db
          .query("roomVersions")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();
        return {
          _creationTime: room._creationTime,
          _id: room._id,
          imageUrl: await ctx.storage.getUrl(storageId),
          role: (room.userId === ctx.userId
            ? "owner"
            : "collaborator") satisfies Role as Role,
          status: room.status,
          title: room.title,
          versionCount: versions.length,
        };
      })
    );
  },
  returns: v.array(
    v.object({
      _creationTime: v.number(),
      _id: v.id("rooms"),
      imageUrl: v.union(v.string(), v.null()),
      role: vRole,
      status: vRoomStatus,
      title: v.optional(v.string()),
      versionCount: v.number(),
    })
  ),
});

/** Everything the room page needs: the room, its versions and its comments. */
export const get = privateQuery({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const access = await findRoomAccess(ctx, ctx.userId, args.roomId);
    if (!access) {
      return null;
    }
    const { role, room } = access;

    const versionDocs = await ctx.db
      .query("roomVersions")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("asc")
      .collect();

    const versions = await Promise.all(
      versionDocs.map(async (version) => ({
        _creationTime: version._creationTime,
        _id: version._id,
        commentId: version.commentId,
        imageUrl: await ctx.storage.getUrl(version.imageStorageId),
        items: version.items ?? [],
        itemsStatus: version.itemsStatus,
        summary: version.summary,
      }))
    );

    const commentDocs = await ctx.db
      .query("roomComments")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("asc")
      .collect();

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    // Comments written before this room had anyone else in it carry no name;
    // fall back to looking their author up so old pins are attributed too.
    const missingNames = commentDocs
      .filter((comment) => comment.authorName === undefined)
      .map((comment) => comment.userId);
    const names = await namesByUserId(ctx, [
      room.userId,
      ...memberships.map((membership) => membership.userId),
      ...missingNames,
    ]);

    const comments = commentDocs.map((comment) => ({
      _creationTime: comment._creationTime,
      _id: comment._id,
      anchor: comment.anchor,
      authorIsOwner: comment.userId === room.userId,
      authorName: comment.authorName ?? names.get(comment.userId),
      baseVersionId: comment.baseVersionId,
      error: comment.error,
      product: comment.product,
      resultVersionId: comment.resultVersionId,
      status: comment.status,
      text: comment.text,
    }));

    const collaborators = memberships.map((membership) => ({
      id: membership.userId,
      name: names.get(membership.userId) ?? GUEST_NAME,
    }));

    return {
      collaborators,
      comments,
      owner: {
        id: room.userId,
        name: names.get(room.userId) ?? GUEST_NAME,
      },
      role,
      room: {
        _creationTime: room._creationTime,
        _id: room._id,
        currentVersionId: room.currentVersionId,
        error: room.error,
        // Only the owner hands out edit access, so only the owner is told
        // whether a link is out there.
        inviteToken: role === "owner" ? room.inviteToken : undefined,
        isListed: room.isListed,
        isPublic: room.isPublic,
        roomType: room.roomType,
        status: room.status,
        style: room.style,
        title: room.title,
      },
      versions,
    };
  },
  returns: v.union(
    v.object({
      collaborators: v.array(vCollaboratorOut),
      comments: v.array(vCommentOut),
      owner: vCollaboratorOut,
      role: vRole,
      room: v.object({
        _creationTime: v.number(),
        _id: v.id("rooms"),
        currentVersionId: v.optional(v.id("roomVersions")),
        error: v.optional(v.string()),
        inviteToken: v.optional(v.string()),
        isListed: v.optional(v.boolean()),
        isPublic: v.optional(v.boolean()),
        roomType: v.optional(vRoomType),
        status: vRoomStatus,
        style: v.optional(vRoomStyle),
        title: v.optional(v.string()),
      }),
      versions: v.array(vVersionOut),
    }),
    v.null()
  ),
});

/**
 * A room cannot sit in the gallery untagged: `/ideas/[roomType]` is the whole
 * point of listing it. Rooms made before tagging existed get classified the
 * moment someone lists them.
 */
async function scheduleClassifyIfNeeded(
  ctx: MutationCtx,
  room: Doc<"rooms">,
  isListed: boolean
) {
  if (!isListed || room.roomType) {
    return;
  }
  await ctx.scheduler.runAfter(0, internal.roomsAi.internalClassifyRoom, {
    roomId: room._id,
  });
}

/**
 * Share a room by link, or stop sharing it. A public room is readable by
 * anyone who has its id through `getPublic`, which never exposes user ids.
 *
 * Sharing also offers the room to the gallery unless the owner says otherwise:
 * the toggle in the share sheet starts on. Unsharing takes it straight back
 * out, because a room nobody can open has no business being advertised.
 */
export const setPublic = privateMutation({
  args: {
    isListed: v.optional(v.boolean()),
    isPublic: v.boolean(),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
    const isListed = args.isPublic ? (args.isListed ?? true) : false;
    await ctx.db.patch(room._id, {
      isListed,
      isPublic: args.isPublic,
      ...(isListed ? { listedAt: Date.now() } : {}),
    });
    await scheduleClassifyIfNeeded(ctx, room, isListed);
    return null;
  },
  returns: v.null(),
});

/**
 * Put a shared room in the public gallery, or take it out again, without
 * touching the share link itself.
 */
export const setListed = privateMutation({
  args: { isListed: v.boolean(), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
    if (args.isListed && !room.isPublic) {
      throw new ConvexError("Share the room first");
    }
    // A room that has been in the gallery before keeps the date it first
    // appeared, so relisting does not jump the queue.
    const firstListing = args.isListed && room.listedAt === undefined;
    await ctx.db.patch(room._id, {
      isListed: args.isListed,
      ...(firstListing ? { listedAt: Date.now() } : {}),
    });
    await scheduleClassifyIfNeeded(ctx, room, args.isListed);
    return null;
  },
  returns: v.null(),
});

/**
 * The shared view of a room: the before and after, the comments that got it
 * there and the furniture in it. Returns null unless the room is public.
 */
export const getPublic = publicQuery({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room?.isPublic) {
      return null;
    }

    const versionDocs = await ctx.db
      .query("roomVersions")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("asc")
      .collect();

    const versions = await Promise.all(
      versionDocs.map(async (version) => ({
        _creationTime: version._creationTime,
        _id: version._id,
        imageUrl: await ctx.storage.getUrl(version.imageStorageId),
        items: (version.items ?? []).map((item) => ({
          box: item.box,
          id: item.id,
          label: item.label,
          products: item.products,
        })),
        summary: version.summary,
      }))
    );

    const commentDocs = await ctx.db
      .query("roomComments")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("asc")
      .collect();

    const comments = commentDocs.map((comment) => ({
      _creationTime: comment._creationTime,
      _id: comment._id,
      anchor: comment.anchor,
      baseVersionId: comment.baseVersionId,
      product: comment.product,
      resultVersionId: comment.resultVersionId,
      status: comment.status,
      text: comment.text,
    }));

    const names = await namesByUserId(ctx, [room.userId]);

    return {
      comments,
      isListed: room.isListed,
      ownerName: names.get(room.userId),
      roomType: room.roomType,
      style: room.style,
      title: room.title,
      versions,
    };
  },
  returns: v.union(
    v.object({
      comments: v.array(vPublicCommentOut),
      isListed: v.optional(v.boolean()),
      ownerName: v.optional(v.string()),
      roomType: v.optional(vRoomType),
      style: v.optional(vRoomStyle),
      title: v.optional(v.string()),
      versions: v.array(vPublicVersionOut),
    }),
    v.null()
  ),
});

/**
 * What an invite link shows before anyone opens it: the room's name, who is
 * asking, and the two photos that make the preview card. The token stands in
 * for a session here, so a stale link or a room already past its clock gets
 * nothing back.
 */
export const getInvitePreview = publicQuery({
  args: { roomId: v.id("rooms"), token: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room?.inviteToken || room.inviteToken !== args.token) {
      return null;
    }
    if (room.expiresAt !== undefined && room.expiresAt <= Date.now()) {
      return null;
    }

    const versions = await ctx.db
      .query("roomVersions")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("asc")
      .collect();

    const before = versions.at(0);
    // The room points at whichever version is on screen; without one, the
    // newest is what the owner is looking at.
    const current = versions.find(
      (version) => version._id === room.currentVersionId
    );
    const after = current ?? versions.at(-1);

    const [names, beforeUrl, afterUrl] = await Promise.all([
      namesByUserId(ctx, [room.userId]),
      before ? ctx.storage.getUrl(before.imageStorageId) : null,
      after ? ctx.storage.getUrl(after.imageStorageId) : null,
    ]);

    return {
      afterUrl,
      beforeUrl,
      ownerName: names.get(room.userId),
      title: room.title,
    };
  },
  returns: v.union(
    v.object({
      afterUrl: v.union(v.string(), v.null()),
      beforeUrl: v.union(v.string(), v.null()),
      ownerName: v.optional(v.string()),
      title: v.optional(v.string()),
    }),
    v.null()
  ),
});

// ---------------------------------------------------------------------------
// The public gallery at /ideas
// ---------------------------------------------------------------------------

/** One room as the gallery grid shows it: the before, the after, the tags. */
const vGalleryCard = v.object({
  afterUrl: v.union(v.string(), v.null()),
  beforeUrl: v.union(v.string(), v.null()),
  commentCount: v.number(),
  itemCount: v.number(),
  listedAt: v.number(),
  ownerName: v.optional(v.string()),
  roomId: v.id("rooms"),
  roomType: v.optional(vRoomType),
  style: v.optional(vRoomStyle),
  title: v.optional(v.string()),
});

/** Listed rooms newest first, narrowed to one room type when asked for. */
async function listedRooms(
  ctx: QueryCtx,
  roomType: RoomType | undefined,
  take: number
): Promise<Doc<"rooms">[]> {
  if (roomType === undefined) {
    return await ctx.db
      .query("rooms")
      .withIndex("by_listed", (q) => q.eq("isListed", true))
      .order("desc")
      .take(take);
  }
  return await ctx.db
    .query("rooms")
    .withIndex("by_listed_type", (q) =>
      q.eq("isListed", true).eq("roomType", roomType)
    )
    .order("desc")
    .take(take);
}

/**
 * The two photos a card is made of, or null when there is nothing to show
 * yet: a room earns its place in the gallery by having been changed.
 */
function galleryPair(room: Doc<"rooms">, versions: Doc<"roomVersions">[]) {
  if (versions.length < MIN_GALLERY_VERSIONS) {
    return null;
  }
  const before = versions.at(0);
  const current = versions.find(
    (version) => version._id === room.currentVersionId
  );
  const after = current ?? versions.at(-1);
  if (!(before && after) || before._id === after._id) {
    return null;
  }
  return { after, before };
}

/**
 * The gallery: public rooms whose owners offered them up, newest first.
 *
 * Filtering happens in memory after the index read because what makes a room
 * worth showing — a finished render that differs from the photo it started as
 * — lives in its versions, not on the room.
 */
export const listGallery = publicQuery({
  args: {
    limit: v.optional(v.number()),
    roomType: v.optional(vRoomType),
    style: v.optional(vRoomStyle),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(
      args.limit ?? GALLERY_DEFAULT_LIMIT,
      GALLERY_MAX_LIMIT
    );
    const candidates = await listedRooms(
      ctx,
      args.roomType,
      limit * GALLERY_OVERFETCH
    );

    const eligible = candidates.filter(
      (room) =>
        room.isPublic &&
        room.status === "ready" &&
        (args.style === undefined || room.style === args.style)
    );

    const withVersions = await Promise.all(
      eligible.map(async (room) => ({
        room,
        versions: await ctx.db
          .query("roomVersions")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .order("asc")
          .collect(),
      }))
    );

    const showable = withVersions
      .map(({ room, versions }) => {
        const pair = galleryPair(room, versions);
        return pair ? { ...pair, room } : null;
      })
      .filter((entry) => entry !== null)
      .slice(0, limit);

    const names = await namesByUserId(
      ctx,
      showable.map((entry) => entry.room.userId)
    );

    const rooms = await Promise.all(
      showable.map(async ({ after, before, room }) => {
        const [beforeUrl, afterUrl, comments] = await Promise.all([
          ctx.storage.getUrl(before.imageStorageId),
          ctx.storage.getUrl(after.imageStorageId),
          ctx.db
            .query("roomComments")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect(),
        ]);
        return {
          afterUrl,
          beforeUrl,
          commentCount: comments.filter(
            (comment) => comment.status === "applied"
          ).length,
          itemCount: after.items?.length ?? 0,
          listedAt: room.listedAt ?? room._creationTime,
          ownerName: names.get(room.userId),
          roomId: room._id,
          roomType: room.roomType,
          style: room.style,
          title: room.title,
        };
      })
    );

    return { rooms };
  },
  returns: v.object({ rooms: v.array(vGalleryCard) }),
});

/** Every listed room, for the sitemap. Ids and dates only. */
export const listGalleryForSitemap = publicQuery({
  args: {},
  handler: async (ctx) => {
    const listed = await ctx.db
      .query("rooms")
      .withIndex("by_listed", (q) => q.eq("isListed", true))
      .order("desc")
      .take(GALLERY_SCAN_CAP);

    return {
      rooms: listed
        .filter((room) => room.isPublic)
        .map((room) => ({
          listedAt: room.listedAt ?? room._creationTime,
          roomId: room._id,
          roomType: room.roomType,
        })),
    };
  },
  returns: v.object({
    rooms: v.array(
      v.object({
        listedAt: v.number(),
        roomId: v.id("rooms"),
        roomType: v.optional(vRoomType),
      })
    ),
  }),
});

/** How many listed rooms there are of each type, biggest category first. */
export const galleryCounts = publicQuery({
  args: {},
  handler: async (ctx) => {
    const listed = await ctx.db
      .query("rooms")
      .withIndex("by_listed", (q) => q.eq("isListed", true))
      .order("desc")
      .take(GALLERY_SCAN_CAP);

    const tally = new Map<RoomType, number>();
    for (const room of listed) {
      if (room.isPublic && room.roomType) {
        tally.set(room.roomType, (tally.get(room.roomType) ?? 0) + 1);
      }
    }

    return {
      counts: [...tally]
        .map(([roomType, count]) => ({ count, roomType }))
        .sort((a, b) => b.count - a.count),
    };
  },
  returns: v.object({
    counts: v.array(v.object({ count: v.number(), roomType: vRoomType })),
  }),
});

/** What a comment asks for, before it is a row. */
interface CommentRequest {
  anchor?: Doc<"roomComments">["anchor"];
  baseVersionId: Id<"roomVersions">;
  product?: Doc<"roomComments">["product"];
  text: string;
}

/**
 * Record a change request and set the render going.
 *
 * Words and products come through here together: one wait-your-turn guard,
 * one scheduled action. As far as the room is concerned, choosing a sofa off
 * Amazon is just another comment.
 */
async function queueComment(
  ctx: MutationCtx,
  room: Doc<"rooms">,
  author: { name: string; userId: string },
  request: CommentRequest
): Promise<Id<"roomComments">> {
  if (room.status === "generating") {
    throw new Error("Please wait for the current change to finish");
  }

  const commentId = await ctx.db.insert("roomComments", {
    anchor: request.anchor,
    authorName: author.name,
    baseVersionId: request.baseVersionId,
    product: request.product,
    roomId: room._id,
    status: "pending",
    text: request.text,
    userId: author.userId,
  });

  await ctx.db.patch(room._id, { error: undefined, status: "generating" });
  await ctx.scheduler.runAfter(0, internal.roomsAi.applyComment, {
    commentId,
  });

  return commentId;
}

/**
 * Leave a comment asking for a change. The change is applied to the version
 * currently displayed and produces a new version when it finishes.
 */
export const addComment = privateMutation({
  args: {
    anchor: v.optional(vAnchor),
    roomId: v.id("rooms"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await getEditableRoom(ctx, ctx.userId, args.roomId);
    const text = args.text.trim().slice(0, MAX_COMMENT_LENGTH);
    if (!text) {
      throw new Error("Comment cannot be empty");
    }
    if (!room.currentVersionId) {
      throw new Error("Room has no image yet");
    }

    return await queueComment(
      ctx,
      room,
      { name: displayName(ctx.user), userId: ctx.userId },
      {
        anchor: args.anchor,
        baseVersionId: room.currentVersionId,
        text,
      }
    );
  },
  returns: v.id("roomComments"),
});

/** Half of something: the middle of a box is where its pin goes. */
const HALF = 0.5;

/** A product someone tapped, and the item in the photo it should replace. */
interface ProductChoice {
  baseVersionId: Id<"roomVersions">;
  itemId: string;
  product: NonNullable<Doc<"roomComments">["product"]>;
}

/**
 * Turn a chosen product into a comment on the item it replaces, pinned at the
 * middle of that item's box so the render and the detection that follows it
 * both know which object was meant.
 */
async function placeProduct(
  ctx: MutationCtx,
  room: Doc<"rooms">,
  author: { name: string; userId: string },
  choice: ProductChoice
): Promise<Id<"roomComments">> {
  const baseVersion = await ctx.db.get(choice.baseVersionId);
  if (!baseVersion || baseVersion.roomId !== room._id) {
    throw new ConvexError("Version not found");
  }
  const item = baseVersion.items?.find(
    (candidate) => candidate.id === choice.itemId
  );
  if (!item) {
    throw new ConvexError("Item not found");
  }

  const name = choice.product.name.slice(0, PRODUCT_NAME_MAX_LENGTH);
  return await queueComment(ctx, room, author, {
    anchor: {
      x: item.box.x + item.box.width * HALF,
      y: item.box.y + item.box.height * HALF,
    },
    baseVersionId: baseVersion._id,
    product: choice.product,
    text: `Put this ${item.label.toLowerCase()} in the room: ${name}`,
  });
}

/**
 * Put a product someone tapped into the photo. It reads like a comment they
 * could have typed, but it carries the listing itself, so the render works
 * from the product's own photo rather than a description of it.
 */
export const addProductComment = privateMutation({
  args: {
    baseVersionId: v.id("roomVersions"),
    itemId: v.string(),
    product: vProduct,
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await getEditableRoom(ctx, ctx.userId, args.roomId);
    return await placeProduct(
      ctx,
      room,
      { name: displayName(ctx.user), userId: ctx.userId },
      args
    );
  },
  returns: v.id("roomComments"),
});

/** Show a different version (browse history or revert). */
export const setCurrentVersion = privateMutation({
  args: { roomId: v.id("rooms"), versionId: v.id("roomVersions") },
  handler: async (ctx, args) => {
    const room = await getEditableRoom(ctx, ctx.userId, args.roomId);
    const version = await ctx.db.get(args.versionId);
    if (!version || version.roomId !== room._id) {
      throw new Error("Version not found");
    }
    await ctx.db.patch(room._id, { currentVersionId: version._id });
    return null;
  },
  returns: v.null(),
});

export const rename = privateMutation({
  args: { roomId: v.id("rooms"), title: v.string() },
  handler: async (ctx, args) => {
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
    await ctx.db.patch(room._id, {
      title: args.title.trim().slice(0, MAX_TITLE_LENGTH),
    });
    return null;
  },
  returns: v.null(),
});

/**
 * Erase a room and everything hanging off it: every rendered version and the
 * image behind it, every comment, and everyone's access to it.
 */
async function deleteRoomCascade(ctx: MutationCtx, roomId: Id<"rooms">) {
  const versions = await ctx.db
    .query("roomVersions")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();
  await Promise.all(
    versions.map(async (version) => {
      await ctx.storage.delete(version.imageStorageId);
      await ctx.db.delete(version._id);
    })
  );

  const comments = await ctx.db
    .query("roomComments")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();
  await Promise.all(comments.map((comment) => ctx.db.delete(comment._id)));

  const memberships = await ctx.db
    .query("roomMembers")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();
  await Promise.all(
    memberships.map((membership) => ctx.db.delete(membership._id))
  );

  await ctx.db.delete(roomId);
}

/** Delete a room with all of its versions, comments and stored images. */
export const remove = privateMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
    await deleteRoomCascade(ctx, room._id);
    return null;
  },
  returns: v.null(),
});

// ---------------------------------------------------------------------------
// Inviting people to edit
// ---------------------------------------------------------------------------

const HEX_RADIX = 16;
const BYTE_HEX_WIDTH = 2;

/** An unguessable token for an invite link. */
function newInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(INVITE_TOKEN_BYTES));
  return Array.from(bytes, (byte) =>
    byte.toString(HEX_RADIX).padStart(BYTE_HEX_WIDTH, "0")
  ).join("");
}

/**
 * Start sharing a room for editing, or hand back the link already in play.
 *
 * Read-only sharing needs no account, but an editable room outlives the
 * session that made it, so the owner has to have somewhere to come back to.
 */
export const createInvite = privateMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    if (ctx.user.isAnonymous) {
      throw new ConvexError("Sign in to invite people");
    }
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
    if (room.inviteToken) {
      return room.inviteToken;
    }
    const inviteToken = newInviteToken();
    await ctx.db.patch(room._id, { inviteToken });
    return inviteToken;
  },
  returns: v.string(),
});

/** Kill the invite link. People already in the room stay in it. */
export const revokeInvite = privateMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
    await ctx.db.patch(room._id, { inviteToken: undefined });
    return null;
  },
  returns: v.null(),
});

/**
 * Accept an invite. Anyone signed in can, including a visitor who has only an
 * anonymous session — the point of a link is that it works on first click.
 */
export const joinWithInvite = privateMutation({
  args: { roomId: v.id("rooms"), token: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room?.inviteToken || room.inviteToken !== args.token) {
      throw new ConvexError("This invite link is no longer valid");
    }
    if (room.userId === ctx.userId) {
      return "owner" as const;
    }
    const existing = await findMembership(ctx, ctx.userId, room._id);
    if (!existing) {
      await ctx.db.insert("roomMembers", {
        roomId: room._id,
        userId: ctx.userId,
      });
    }
    return "collaborator" as const;
  },
  returns: vRole,
});

/** Take someone's edit access away. Their comments and versions stay. */
export const removeCollaborator = privateMutation({
  args: { roomId: v.id("rooms"), userId: v.string() },
  handler: async (ctx, args) => {
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
    const membership = await findMembership(ctx, args.userId, room._id);
    if (membership) {
      await ctx.db.delete(membership._id);
    }
    return null;
  },
  returns: v.null(),
});

/** Show yourself out of a room someone else owns. */
export const leaveRoom = privateMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const membership = await findMembership(ctx, ctx.userId, args.roomId);
    if (!membership) {
      throw new ConvexError("You are not a member of this room");
    }
    await ctx.db.delete(membership._id);
    return null;
  },
  returns: v.null(),
});

// ---------------------------------------------------------------------------
// Anonymous room retention
// ---------------------------------------------------------------------------

/**
 * Delete the rooms whose seven days are up, a batch at a time.
 *
 * A room with collaborators in it is left alone: other people are using it,
 * and taking it out from under them is worse than keeping one photo around
 * until its owner deletes it.
 */
export const internalPurgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("rooms")
      .withIndex("by_expiresAt", (q) =>
        q.gt("expiresAt", 0).lt("expiresAt", now)
      )
      .take(PURGE_BATCH_SIZE);

    const candidates = await Promise.all(
      expired.map(async (room) => {
        const member = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .first();
        if (member) {
          // Shared rooms are kept; drop the stamp so it stops being rescanned.
          await ctx.db.patch(room._id, { expiresAt: undefined });
          return null;
        }
        return room._id;
      })
    );
    const doomed = candidates.filter((id): id is Id<"rooms"> => id !== null);
    await Promise.all(doomed.map((id) => deleteRoomCascade(ctx, id)));

    return { deleted: doomed.length, scanned: expired.length };
  },
  returns: v.object({ deleted: v.number(), scanned: v.number() }),
});

// ---------------------------------------------------------------------------
// Account linking
// ---------------------------------------------------------------------------

/**
 * Move everything owned by one user id to another.
 *
 * Called from Better Auth's anonymous `onLinkAccount` hook: a visitor who
 * used the product without an account keeps their rooms when they sign up,
 * and the anonymous user record is deleted right after this runs.
 */
export const internalTransferOwnership = internalMutation({
  args: {
    fromUserId: v.string(),
    toUserId: v.string(),
    toUserName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.fromUserId === args.toUserId) {
      return { likes: 0, rooms: 0 };
    }

    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_user", (q) => q.eq("userId", args.fromUserId))
      .collect();

    // There is an account behind these rooms now, so the seven-day clock the
    // anonymous session put on them comes off.
    await Promise.all(
      rooms.map((room) =>
        ctx.db.patch(room._id, {
          expiresAt: undefined,
          userId: args.toUserId,
        })
      )
    );

    // Rooms they were invited to before signing up follow them too.
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.fromUserId))
      .collect();

    await Promise.all(
      memberships.map(async (membership) => {
        const alreadyThere = await ctx.db
          .query("roomMembers")
          .withIndex("by_room_and_user", (q) =>
            q.eq("roomId", membership.roomId).eq("userId", args.toUserId)
          )
          .unique();
        const room = await ctx.db.get(membership.roomId);
        if (alreadyThere || room?.userId === args.toUserId) {
          await ctx.db.delete(membership._id);
          return;
        }
        await ctx.db.patch(membership._id, { userId: args.toUserId });
      })
    );

    // Comments are reached through their room, so they follow it. The ones
    // this person wrote as a guest get their new name.
    const authorName = args.toUserName?.trim() || undefined;
    const commentsByRoom = await Promise.all(
      rooms.map((room) =>
        ctx.db
          .query("roomComments")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect()
      )
    );
    await Promise.all(
      commentsByRoom
        .flat()
        .filter((comment) => comment.userId === args.fromUserId)
        .map((comment) =>
          ctx.db.patch(comment._id, {
            ...(authorName ? { authorName } : {}),
            userId: args.toUserId,
          })
        )
    );

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", args.fromUserId))
      .collect();

    await Promise.all(
      likes.map((like) => ctx.db.patch(like._id, { userId: args.toUserId }))
    );

    return { likes: likes.length, rooms: rooms.length };
  },
  returns: v.object({ likes: v.number(), rooms: v.number() }),
});

// ---------------------------------------------------------------------------
// Internal helpers used by roomsAi actions
// ---------------------------------------------------------------------------

export const internalGetVersion = internalQuery({
  args: { versionId: v.id("roomVersions") },
  handler: async (ctx, args) => await ctx.db.get(args.versionId),
});

/** What the room is already tagged with, so detection only fills a gap. */
export const internalGetRoomTags = internalQuery({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return null;
    }
    return { roomType: room.roomType, style: room.style };
  },
});

/**
 * The image to classify an untagged room from: whichever version its owner is
 * looking at. Null when the room is gone or already tagged, which is the
 * common case by the time a scheduled backfill runs.
 */
export const internalGetRoomToClassify = internalQuery({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.roomType) {
      return null;
    }
    const versions = await ctx.db
      .query("roomVersions")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("asc")
      .collect();
    const current = versions.find(
      (version) => version._id === room.currentVersionId
    );
    const shown = current ?? versions.at(-1);
    return shown ? { imageStorageId: shown.imageStorageId } : null;
  },
});

/** Record the room type and style the vision model read off the photo. */
export const internalSetRoomTags = internalMutation({
  args: {
    roomId: v.id("rooms"),
    roomType: vRoomType,
    style: vRoomStyle,
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return null;
    }
    await ctx.db.patch(room._id, {
      roomType: args.roomType,
      style: args.style,
    });
    return null;
  },
  returns: v.null(),
});

/**
 * The product a comment placed, if it placed one. Detection reads it back to
 * seed the real listing onto the item it has just found in the new photo.
 */
export const internalGetCommentProduct = internalQuery({
  args: { commentId: v.id("roomComments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment?.product) {
      return null;
    }
    return { anchor: comment.anchor, product: comment.product };
  },
  returns: v.union(
    v.object({ anchor: v.optional(vAnchor), product: vProduct }),
    v.null()
  ),
});

export const internalGetCommentContext = internalQuery({
  args: { commentId: v.id("roomComments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      return null;
    }
    const room = await ctx.db.get(comment.roomId);
    const baseVersion = await ctx.db.get(comment.baseVersionId);
    if (!(room && baseVersion)) {
      return null;
    }
    return { baseVersion, comment, room };
  },
});

/** Access check for client-triggered actions: owner or invited editor. */
export const internalAssertVersionEditor = internalQuery({
  args: { userId: v.string(), versionId: v.id("roomVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) {
      return null;
    }
    const access = await findRoomAccess(ctx, args.userId, version.roomId);
    return access ? version : null;
  },
});

/** Record a rendered result: new version, comment applied, room ready. */
export const internalCompleteComment = internalMutation({
  args: {
    commentId: v.id("roomComments"),
    imageStorageId: v.id("_storage"),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    const versionId = await ctx.db.insert("roomVersions", {
      commentId: comment._id,
      imageStorageId: args.imageStorageId,
      itemsStatus: "pending",
      roomId: comment.roomId,
      summary: args.summary ?? comment.text,
    });
    await ctx.db.patch(comment._id, {
      error: undefined,
      resultVersionId: versionId,
      status: "applied",
    });
    await ctx.db.patch(comment.roomId, {
      currentVersionId: versionId,
      error: undefined,
      status: "ready",
    });
    return versionId;
  },
  returns: v.id("roomVersions"),
});

export const internalFailComment = internalMutation({
  args: { commentId: v.id("roomComments"), error: v.string() },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      return null;
    }
    await ctx.db.patch(comment._id, { error: args.error, status: "failed" });
    await ctx.db.patch(comment.roomId, { error: args.error, status: "ready" });
    return null;
  },
  returns: v.null(),
});

export const internalSetItems = internalMutation({
  args: {
    items: v.optional(v.array(vRoomItem)),
    status: vItemsStatus,
    versionId: v.id("roomVersions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.versionId, {
      itemsStatus: args.status,
      ...(args.items ? { items: args.items } : {}),
    });
    return null;
  },
  returns: v.null(),
});

export const internalSetItemProducts = internalMutation({
  args: {
    itemId: v.string(),
    products: v.optional(v.array(vProduct)),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("error")
    ),
    versionId: v.id("roomVersions"),
  },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version?.items) {
      return null;
    }
    const items = version.items.map((item) =>
      item.id === args.itemId
        ? {
            ...item,
            productsStatus: args.status,
            ...(args.products ? { products: args.products } : {}),
          }
        : item
    );
    await ctx.db.patch(args.versionId, { items });
    return null;
  },
  returns: v.null(),
});

// ---------------------------------------------------------------------------
// Cached Amazon searches
// ---------------------------------------------------------------------------

/** Find a cached search. A fortnight-old answer to "grey linen sofa" is fine. */
export const internalGetCachedProducts = internalQuery({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const query = normalizeSearchQuery(args.query);
    const cached = await ctx.db
      .query("productSearches")
      .withIndex("by_query", (q) => q.eq("query", query))
      .first();
    if (!cached || Date.now() - cached.fetchedAt > PRODUCT_SEARCH_TTL_MS) {
      return null;
    }
    return cached.products;
  },
  returns: v.union(v.array(vProduct), v.null()),
});

/** Keep what a paid search returned, for whoever asks the same thing next. */
export const internalCacheProducts = internalMutation({
  args: { products: v.array(vProduct), query: v.string() },
  handler: async (ctx, args) => {
    const query = normalizeSearchQuery(args.query);
    const fields = {
      fetchedAt: Date.now(),
      products: args.products,
      query,
    };
    const existing = await ctx.db
      .query("productSearches")
      .withIndex("by_query", (q) => q.eq("query", query))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return null;
    }
    await ctx.db.insert("productSearches", fields);
    return null;
  },
  returns: v.null(),
});

/**
 * Drop cached searches nobody has refreshed in a month, a batch at a time.
 * They stop being served after two weeks; this is what stops the table from
 * growing forever behind them.
 */
export const internalPruneProductSearches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - PRODUCT_SEARCH_MAX_AGE_MS;
    const stale = await ctx.db
      .query("productSearches")
      .withIndex("by_fetchedAt", (q) => q.lt("fetchedAt", cutoff))
      .take(PRODUCT_SEARCH_PRUNE_BATCH);
    await Promise.all(stale.map((row) => ctx.db.delete(row._id)));
    return { deleted: stale.length };
  },
  returns: v.object({ deleted: v.number() }),
});
