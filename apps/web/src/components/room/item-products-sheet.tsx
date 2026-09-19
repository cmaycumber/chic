"use client";

import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { ExternalLink, Star, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import type { RoomItem, RoomProduct } from "./types";
import { useItemProducts } from "./use-item-products";
import {
  amazonSearchUrl,
  formatPrice,
  GLASS_RESET,
  PANEL_DISPLACEMENT,
  PANEL_RADIUS,
} from "./utils";

const SKELETON_KEYS = ["first", "second", "third"] as const;
const RATING_DECIMALS = 1;

interface ItemProductsSheetProps {
  item: RoomItem;
  onClose: () => void;
  versionId: Id<"roomVersions">;
}

function ProductCard({ product }: { product: RoomProduct }) {
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
        <Button asChild className="mt-1 w-fit" size="sm" variant="glass-brass">
          <a
            href={product.productUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            View on Amazon
          </a>
        </Button>
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
  item,
  versionId,
}: {
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
            <ProductCard key={product.productUrl} product={product} />
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
  item,
  onClose,
  versionId,
}: ItemProductsSheetProps) {
  const isMobile = useIsMobile();

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
            <ProductsBody item={item} versionId={versionId} />
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
            <ProductsBody item={item} versionId={versionId} />
          </div>
        </div>
      </LiquidGlass>
    </aside>
  );
}
