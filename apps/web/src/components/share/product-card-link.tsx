"use client";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/**
 * The "View on {store}" button on the share page. A client component so the
 * click can be tracked; the share page itself renders on the server, which
 * cannot attach event handlers.
 */
export function ProductCardLink({
  href,
  label,
  price,
  retailer,
}: {
  href: string;
  label: string;
  price: number;
  retailer?: string;
}) {
  return (
    <Button asChild className="mt-2 w-full" size="sm" variant="brass">
      <a
        href={href}
        onClick={() =>
          track("product_clicked", { price, retailer, source: "share" })
        }
        rel="noopener noreferrer"
        target="_blank"
      >
        {label}
      </a>
    </Button>
  );
}
