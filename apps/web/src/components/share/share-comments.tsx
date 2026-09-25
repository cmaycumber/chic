import Image from "next/image";
import { ProductChip } from "@/components/room/product-chip";
import { buildPinNumbers, planProducts } from "@/components/room/utils";
import type { PublicComment, PublicVersion } from "./types";

interface ShareCommentsProps {
  comments: PublicComment[];
  versions: PublicVersion[];
}

function ThumbnailFor({
  alt,
  imageUrl,
}: {
  alt: string;
  imageUrl: string | null;
}) {
  if (!imageUrl) {
    return null;
  }
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink sm:size-20">
      <Image
        alt={alt}
        className="object-cover"
        fill
        sizes="80px"
        src={imageUrl}
      />
    </div>
  );
}

/**
 * How the room got here: every comment that changed the photo, in order,
 * numbered the way its pin was numbered on the photo itself.
 */
export function ShareComments({ comments, versions }: ShareCommentsProps) {
  const pinNumbers = buildPinNumbers(comments);
  const applied = comments.filter(
    (comment) => comment.resultVersionId !== undefined
  );

  if (applied.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="font-serif text-2xl text-foreground sm:text-3xl">
        The comments that made it
      </h2>

      <ol className="mt-5 flex flex-col gap-3">
        {applied.map((comment) => {
          const pinNumber = pinNumbers.get(comment._id);
          const version = versions.find(
            (candidate) => candidate._id === comment.resultVersionId
          );
          return (
            <li
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              key={comment._id}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-brass)] font-medium text-[11px] text-white">
                {pinNumber ?? "•"}
              </span>
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <p className="text-foreground text-sm leading-snug">
                  {comment.text}
                </p>
                {comment.product ? (
                  <ProductChip product={comment.product} tone="light" />
                ) : null}
                {planProducts(comment).map((product) => (
                  <ProductChip
                    key={product.productUrl}
                    product={product}
                    tone="light"
                  />
                ))}
              </div>
              <ThumbnailFor
                alt={comment.text}
                imageUrl={version?.imageUrl ?? null}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
