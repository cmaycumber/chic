/**
 * Rooms: an uploaded photo the user iterates on by leaving comments.
 *
 * Flow:
 *  1. `create` stores the upload as version 0 and schedules item detection.
 *  2. `addComment` records the request and schedules `roomsAi.applyComment`,
 *     which renders a new version and marks the comment applied.
 *  3. `roomsAi.searchItemProducts` lazily fetches Amazon products for an item.
 */
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { privateMutation, privateQuery } from "./lib/utils";
import {
  vAnchor,
  vCommentStatus,
  vItemsStatus,
  vProduct,
  vRoomItem,
  vRoomStatus,
} from "./schema";

const MAX_COMMENT_LENGTH = 1000;
const MAX_TITLE_LENGTH = 120;

type Ctx = QueryCtx | MutationCtx;

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
  baseVersionId: v.id("roomVersions"),
  error: v.optional(v.string()),
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
    const roomId = await ctx.db.insert("rooms", {
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

/** List the current user's rooms, newest first, with a thumbnail. */
export const list = privateQuery({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .collect();

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
    const room = await ctx.db.get(args.roomId);
    if (!room || room.userId !== ctx.userId) {
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

    const comments = commentDocs.map((comment) => ({
      _creationTime: comment._creationTime,
      _id: comment._id,
      anchor: comment.anchor,
      baseVersionId: comment.baseVersionId,
      error: comment.error,
      resultVersionId: comment.resultVersionId,
      status: comment.status,
      text: comment.text,
    }));

    return {
      comments,
      room: {
        _creationTime: room._creationTime,
        _id: room._id,
        currentVersionId: room.currentVersionId,
        error: room.error,
        status: room.status,
        title: room.title,
      },
      versions,
    };
  },
  returns: v.union(
    v.object({
      comments: v.array(vCommentOut),
      room: v.object({
        _creationTime: v.number(),
        _id: v.id("rooms"),
        currentVersionId: v.optional(v.id("roomVersions")),
        error: v.optional(v.string()),
        status: vRoomStatus,
        title: v.optional(v.string()),
      }),
      versions: v.array(vVersionOut),
    }),
    v.null()
  ),
});

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
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
    const text = args.text.trim().slice(0, MAX_COMMENT_LENGTH);
    if (!text) {
      throw new Error("Comment cannot be empty");
    }
    if (room.status === "generating") {
      throw new Error("Please wait for the current change to finish");
    }
    if (!room.currentVersionId) {
      throw new Error("Room has no image yet");
    }

    const commentId = await ctx.db.insert("roomComments", {
      anchor: args.anchor,
      baseVersionId: room.currentVersionId,
      roomId: room._id,
      status: "pending",
      text,
      userId: ctx.userId,
    });

    await ctx.db.patch(room._id, { error: undefined, status: "generating" });
    await ctx.scheduler.runAfter(0, internal.roomsAi.applyComment, {
      commentId,
    });

    return commentId;
  },
  returns: v.id("roomComments"),
});

/** Show a different version (browse history or revert). */
export const setCurrentVersion = privateMutation({
  args: { roomId: v.id("rooms"), versionId: v.id("roomVersions") },
  handler: async (ctx, args) => {
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);
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

/** Delete a room with all of its versions, comments and stored images. */
export const remove = privateMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await getOwnedRoom(ctx, ctx.userId, args.roomId);

    const versions = await ctx.db
      .query("roomVersions")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    await Promise.all(
      versions.map(async (version) => {
        await ctx.storage.delete(version.imageStorageId);
        await ctx.db.delete(version._id);
      })
    );

    const comments = await ctx.db
      .query("roomComments")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    await Promise.all(comments.map((comment) => ctx.db.delete(comment._id)));

    await ctx.db.delete(room._id);
    return null;
  },
  returns: v.null(),
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
  args: { fromUserId: v.string(), toUserId: v.string() },
  handler: async (ctx, args) => {
    if (args.fromUserId === args.toUserId) {
      return { likes: 0, rooms: 0 };
    }

    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_user", (q) => q.eq("userId", args.fromUserId))
      .collect();

    await Promise.all(
      rooms.map((room) => ctx.db.patch(room._id, { userId: args.toUserId }))
    );

    // Comments are reached through their room, so they follow it.
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
        .map((comment) => ctx.db.patch(comment._id, { userId: args.toUserId }))
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

/** Owner check for client-triggered actions. */
export const internalAssertVersionOwner = internalQuery({
  args: { userId: v.string(), versionId: v.id("roomVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) {
      return null;
    }
    const room = await ctx.db.get(version.roomId);
    if (!room || room.userId !== args.userId) {
      return null;
    }
    return version;
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
