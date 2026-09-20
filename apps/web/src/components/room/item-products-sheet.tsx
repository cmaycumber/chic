"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ExternalLink, Sparkles, Star, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import type { RoomItem, RoomProduct } from "./types";
import { useItemProducts } from "./use-item-products";
import {
  amazonSearchUrl,
  errorMessage,
  formatPrice,
  GLASS_RESET,
  PANEL_DISPLACEMENT,
  PANEL_RADIUS,
  shortProductName,
} from "./utils";

const SKELETON_KEYS = ["first", "second", "third"] as const;
const RATING_DECIMALS = 1;

interface ItemProductsSheetProps {
  /** Owners and invited editors can put a product in the photo; nobody else. */
  canEdit: boolean;
  isGenerating: boolean;
  item: RoomItem;
  onClose: () => void;
  roomId: Id<"rooms">;
  versionId: Id<"roomVersions">;
}

/** Everything a product card needs to offer "Add to room". */
interface AddState {
  canEdit: boolean;
  isGenerating: boolean;
  onAdd: (product: RoomProduct) => void;
  /** The product link we are asking the backend about right now. */
  pendingUrl: string | null;
}

/**
 * Asking for a real product is just a comment: it renders that exact piece
 * into the photo and lands in the history beside everything else you asked
 * for, so the sheet can close the moment the comment exists.
 */
function useAddProduct({
  baseVersionId,
  itemId,
  onClose,
  roomId,
}: {
  baseVersionId: Id<"roomVersions">;
  itemId: string;
  onClose: () => void;
  roomId: Id<"rooms">;
}) {
  const addProductComment = useMutation(api.rooms.addProductComment);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const onAdd = useCallback(
    (product: RoomProduct) => {
      setPendingUrl(product.productUrl);
      addProductComment({
        baseVersionId,
        itemId,
        product: {
          imageUrl: product.imageUrl,
          name: product.name,
          price: product.price,
          productUrl: product.productUrl,
          rating: product.rating,
          reviewCount: product.reviewCount,
        },
        roomId,
      })
        .then(() => {
          toast.success(
            `Rendering ${shortProductName(product.name)} into your room`
          );
          onClose();
        })
        .catch((error: unknown) => toast.error(errorMessage(error)))
        .finally(() => setPendingUrl(null));
    },
    [addProductComment, baseVersionId, itemId, onClose, roomId]
  );

  return { onAdd, pendingUrl };
}

/** The whole point of the sheet: put this exact thing in my photo. */
function AddToRoomButton({
  add,
  product,
}: {
  add: AddState;
  product: RoomProduct;
}) {
  if (!add.canEdit) {
    return null;
  }

  const isAdding = add.pendingUrl === product.productUrl;
  const isBusy = add.isGenerating || add.pendingUrl !== null;

  return (
    <Button
      className="w-fit"
      disabled={isBusy}
      onClick={() => add.onAdd(product)}
      size="sm"
      type="button"
      variant="glass-brass"
    >
      {isAdding ? <Spinner className="size-3.5" /> : <Sparkles />}
      {add.isGenerating ? "Rendering…" : "Add to room"}
    </Button>
  );
}

function ProductCard({
  add,
  product,
}: {
  add: AddState;
  product: RoomProduct;
}) {
  return (
    <li className="flex gap-3 rounded-2xl bg-white/5 p-2.5">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
        <Image
          alt={product.name}
          className="object-contain"
          fill
          sizes="64px"
          src={product.imageUrl}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-sm text-white leading-snug">
          {product.name}
        </p>
        <p className="font-medium text-sm text-white">
          {formatPrice(product.price)}
        </p>
        {product.rating !== undefined && (
          <p className="flex items-center gap-1 text-white/60 text-xs">
            <Star className="size-3 fill-[var(--accent-brass)] text-[var(--accent-brass)]" />
            {product.rating.toFixed(RATING_DECIMALS)}
            {product.reviewCount !== undefined && (
              <span>({product.reviewCount.toLocaleString("en-US")})</span>
            )}
          </p>
        )}
        {/* Putting the piece in the photo is the offer here, so buying it
            steps back to a link and both actions fit one line at 390px. */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <AddToRoomButton add={add} product={product} />
          <a
            className="inline-flex items-center gap-1 text-white/60 text-xs underline-offset-4 hover:text-white hover:underline"
            href={product.productUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            View on Amazon
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </li>
  );
}

function ProductsSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {SKELETON_KEYS.map((key) => (
        <li className="flex gap-3 rounded-2xl bg-white/5 p-2.5" key={key}>
          <Skeleton className="size-16 shrink-0 rounded-xl bg-white/10" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-full bg-white/10" />
            <Skeleton className="h-3 w-2/3 bg-white/10" />
            <Skeleton className="h-7 w-28 rounded-full bg-white/10" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Products for one detected item, plus a manual Amazon search as a fallback. */
function ProductsBody({
  add,
  item,
  versionId,
}: {
  add: AddState;
  item: RoomItem;
  versionId: Id<"roomVersions">;
}) {
  const { message, products, retry, status } = useItemProducts(versionId, item);
  const isLoading = status === "loading" && products.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {Boolean(isLoading) && <ProductsSkeleton />}

      {status === "error" && (
        <div className="flex flex-col items-start gap-2 rounded-2xl bg-[var(--accent-coral)]/15 p-3">
          <p className="text-sm text-white/80">
            {message ?? "We could not load products for this item."}
          </p>
          <Button onClick={retry} size="sm" type="button" variant="glass-dark">
            Try again
          </Button>
        </div>
      )}

      {products.length > 0 && (
        <ul className="flex flex-col gap-2">
          {products.map((product) => (
            <ProductCard add={add} key={product.productUrl} product={product} />
          ))}
        </ul>
      )}

      {!(isLoading || products.length > 0 || status === "error") && (
        <p className="text-sm text-white/60">
          No products matched this item yet.
        </p>
      )}

      <a
        className="inline-flex items-center gap-1.5 text-white/60 text-xs underline-offset-4 hover:text-white hover:underline"
        href={amazonSearchUrl(item.searchQuery)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ExternalLink className="size-3" />
        Search Amazon for “{item.searchQuery}”
      </a>
    </div>
  );
}

function SheetHeading({
  description,
  label,
}: {
  description: string;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="truncate font-serif text-lg text-white leading-tight">
        {label}
      </p>
      <p className="line-clamp-2 text-white/60 text-xs">{description}</p>
    </div>
  );
}

/**
 * Desktop gets a floating glass panel beside the photo; phones get a bottom
 * sheet so the photo stays visible above it.
 */
export function ItemProductsSheet({
  canEdit,
  isGenerating,
  item,
  onClose,
  roomId,
  versionId,
}: ItemProductsSheetProps) {
  const isMobile = useIsMobile();
  const { onAdd, pendingUrl } = useAddProduct({
    baseVersionId: versionId,
    itemId: item.id,
    onClose,
    roomId,
  });
  const add: AddState = { canEdit, isGenerating, onAdd, pendingUrl };

  if (isMobile) {
    return (
      <Drawer
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        open
      >
        <DrawerContent className="max-h-[60dvh]! border-white/10 bg-ink text-white">
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
            <div className="min-w-0">
              <DrawerTitle className="truncate font-serif text-lg text-white">
                {item.label}
              </DrawerTitle>
              <DrawerDescription className="line-clamp-2 text-white/60 text-xs">
                {item.description}
              </DrawerDescription>
            </div>
            <Button
              onClick={onClose}
              size="icon-sm"
              type="button"
              variant="glass-dark"
            >
              <X className="size-4" />
              <span className="sr-only">Close products</span>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <ProductsBody add={add} item={item} versionId={versionId} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside className="fixed top-24 right-4 z-40 w-[360px] max-w-[calc(100vw-2rem)]">
      <LiquidGlass
        className={`w-full ${GLASS_RESET}`}
        cornerRadius={PANEL_RADIUS}
        displacementScale={PANEL_DISPLACEMENT}
        refract={false}
        tone="panel"
      >
        <div className="flex max-h-[70vh] w-full flex-col overflow-hidden font-sans">
          <div className="flex shrink-0 items-start justify-between gap-3 p-4 pb-2">
            <SheetHeading description={item.description} label={item.label} />
            <Button
              onClick={onClose}
              size="icon-sm"
              type="button"
              variant="glass-dark"
            >
              <X className="size-4" />
              <span className="sr-only">Close products</span>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4">
            <ProductsBody add={add} item={item} versionId={versionId} />
          </div>
        </div>
      </LiquidGlass>
    </aside>
  );
}
