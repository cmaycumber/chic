"use client";

import { useState } from "react";
import { CreditPurchaseModal } from "@/components/credit-purchase-modal";
import { Button } from "@/components/ui/button";

export function PricingCTA() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <CreditPurchaseModal onOpenChange={setModalOpen} open={modalOpen} />
      <Button
        className="w-full bg-amber-700 py-6 text-lg hover:bg-amber-800"
        onClick={() => setModalOpen(true)}
      >
        Buy Credits
      </Button>
    </>
  );
}
