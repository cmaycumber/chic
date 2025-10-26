"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.back()} size="icon" variant="ghost">
      <ArrowLeftIcon className="size-4" />
    </Button>
  );
}
