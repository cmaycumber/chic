import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "./utils";

/**
 * All a chip shows. Comment products carry ratings and review counts too, but
 * a chip is a receipt, not a listing.
 */
export interface ChipProduct {
  imageUrl: string;
  name: string;
  price: number;
  productUrl: string;
}

const TONES = {
  dark: "bg-white/10 text-white hover:bg-white/20",
  light: "border border-border bg-muted/60 text-foreground hover:bg-muted",
} as const;

function Thumbnail({ imageUrl }: { imageUrl: string }) {
  return (
    <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-white">
      <Image
        alt=""
        className="object-contain"
        fill
        sizes="28px"
        src={imageUrl}
      />
    </span>
  );
}

/**
 * The real product a comment put into the photo, sitting under the comment
 * that asked for it, linking out to buy the exact thing in the picture.
 */
export function ProductChip({
  className,
  product,
  tone,
}: {
  className?: string;
  product: ChipProduct;
  tone: keyof typeof TONES;
}) {
  return (
    <a
      className={cn(
        "mt-1.5 inline-flex max-w-full items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors",
        TONES[tone],
        className
      )}
      href={product.productUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Thumbnail imageUrl={product.imageUrl} />
      <span className="truncate text-xs leading-snug">{product.name}</span>
      <span className="shrink-0 font-medium text-xs">
        {formatPrice(product.price)}
      </span>
    </a>
  );
}

/** The same product, flat, where a hover card cannot take a click. */
export function ProductPreview({ product }: { product: ChipProduct }) {
  return (
    <span className="mt-1.5 flex items-center gap-2 rounded-full bg-white/15 py-1 pr-2.5 pl-1">
      <Thumbnail imageUrl={product.imageUrl} />
      <span className="truncate">{product.name}</span>
    </span>
  );
}
