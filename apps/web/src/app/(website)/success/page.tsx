import type { Metadata } from "next";
import { PurchaseConfirmation } from "@/components/billing/purchase-confirmation";
import { safeReturnPath } from "@/components/billing/return-path";

export const metadata: Metadata = {
  robots: { index: false },
  title: "Edits added",
};

interface SuccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

/** Where Polar sends someone after paying for the edits pack. */
export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const query = await searchParams;

  return (
    <PurchaseConfirmation
      checkoutId={single(query.checkout_id)}
      returnTo={safeReturnPath(single(query.returnTo))}
    />
  );
}
