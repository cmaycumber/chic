"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { errorMessage } from "./utils";

/** A share sheet the visitor dismissed is not an error worth shouting about. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/** Either the link reached the visitor, or they have to copy it themselves. */
export type ShareOutcome = "delivered" | "needs-fallback";

export async function copyShareLink(url: string): Promise<ShareOutcome> {
  if (typeof navigator.clipboard?.writeText !== "function") {
    return "needs-fallback";
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
    return "delivered";
  } catch {
    // Permission policy, an insecure origin, a browser that wants a gesture
    // it did not see: none of that is worth a raw error in a toast.
    return "needs-fallback";
  }
}

/**
 * The OS share sheet is the right gesture on a phone and the wrong one at a
 * desk, where a button that says "Copy" should leave the link on the
 * clipboard instead of opening a panel. A coarse pointer is what tells the
 * two apart; `canShare` then confirms this payload is one the sheet takes.
 */
function prefersShareSheet(title: string, url: string): boolean {
  if (typeof navigator.share !== "function") {
    return false;
  }
  if (!window.matchMedia("(pointer: coarse)").matches) {
    return false;
  }
  return navigator.canShare?.({ title, url }) === true;
}

export async function deliverShareLink(
  title: string,
  url: string
): Promise<ShareOutcome> {
  if (prefersShareSheet(title, url)) {
    try {
      await navigator.share({ title, url });
      return "delivered";
    } catch (error) {
      if (isAbortError(error)) {
        return "delivered";
      }
      // The sheet refused; the clipboard is the next best thing.
    }
  }
  return await copyShareLink(url);
}

/** The link, spelled out, for when neither the sheet nor the clipboard works. */
export function ShareLinkDialog({
  description,
  onClose,
  title,
  url,
}: {
  description: string;
  onClose: () => void;
  title: string;
  url: string;
}) {
  const handleCopy = () => {
    copyShareLink(url)
      .then((outcome) => {
        if (outcome === "delivered") {
          onClose();
          return;
        }
        toast.error("Copying is blocked here. Select the link and copy it.");
      })
      .catch((error: unknown) => toast.error(errorMessage(error)));
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            aria-label={title}
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            value={url}
          />
          <Button
            className="shrink-0"
            onClick={handleCopy}
            type="button"
            variant="brass"
          >
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
