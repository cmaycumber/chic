import Image from "next/image";
import {
  formatPrice,
  planProducts,
  productImage,
  retailerName,
  viewProductLabel,
} from "@/components/room/utils";
import { Button } from "@/components/ui/button";
import type { PublicComment, PublicProduct, PublicVersion } from "./types";

interface ShoppableItem {
  id: string;
  label: string;
  product: PublicProduct;
}

/**
 * The products somebody asked for by name. Everything else on this page is a
 * match we found for imagined furniture; these are the actual thing, so the
 * card gets to say so.
 */
export function inPhotoProductUrls(comments: PublicComment[]): Set<string> {
  const urls = new Set<string>();
  for (const comment of comments) {
    if (comment.resultVersionId === undefined) {
      continue;
    }
    if (comment.product) {
      urls.add(comment.product.productUrl);
    }
    for (const product of planProducts(comment)) {
      urls.add(product.productUrl);
    }
  }
  return urls;
}

/**
 * The furniture in the room as it looks now: the newest version that has
 * products cached for it, one best match per detected item.
 */
export function shoppableItems(versions: PublicVersion[]): ShoppableItem[] {
  for (const version of [...versions].reverse()) {
    const items: ShoppableItem[] = [];
    for (const item of version.items) {
      const product = item.products?.at(0);
      if (product) {
        items.push({ id: item.id, label: item.label, product });
      }
    }
    if (items.length > 0) {
      return items;
    }
  }
  return [];
}

function ProductCard({
  isInPhoto,
  item,
}: {
  isInPhoto: boolean;
  item: ShoppableItem;
}) {
  const { product } = item;
  const image = productImage(product);
  const retailer = retailerName(product);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-square w-full bg-white">
        <Image
          alt={product.name}
          className="object-contain p-3"
          fill
          sizes="(max-width: 640px) 45vw, 240px"
          src={image.src}
          unoptimized={image.unoptimized}
        />
        {isInPhoto ? (
          <span className="absolute top-2 left-2 rounded-full bg-[var(--accent-brass)] px-2 py-0.5 font-medium text-[10px] text-white">
            In this photo
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
          {item.label}
        </p>
        <p className="line-clamp-2 text-foreground text-sm leading-snug">
          {product.name}
        </p>
        <p className="flex min-w-0 items-baseline gap-2 text-sm">
          <span className="shrink-0 font-medium text-foreground">
            {formatPrice(product.price)}
          </span>
          {retailer ? (
            <span className="truncate text-muted-foreground text-xs">
              {retailer}
            </span>
          ) : null}
        </p>
        <Button asChild className="mt-2 w-full" size="sm" variant="brass">
          <a
            href={product.productUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {viewProductLabel(product)}
          </a>
        </Button>
      </div>
    </li>
  );
}

/** Everything in the photo you can actually buy. */
export function ShareShop({
  inPhotoUrls,
  items,
}: {
  inPhotoUrls: Set<string>;
  items: ShoppableItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="font-serif text-2xl text-foreground sm:text-3xl">
        Shop this look
      </h2>
      <p className="mt-1 text-muted-foreground text-sm">
        Found across shops to match the furniture in the photo.
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map((item) => (
          <ProductCard
            isInPhoto={inPhotoUrls.has(item.product.productUrl)}
            item={item}
            key={item.id}
          />
        ))}
      </ul>

      <p className="mt-4 text-muted-foreground text-xs">
        Chic may earn a commission when you buy through these links.
      </p>
    </section>
  );
}
