"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useIsAnonymous } from "@/components/sign-up-to-save";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { track } from "@/lib/analytics";
import { CHECKOUT_PARAM, EDITS_PACK, startCheckout } from "./credits";

const CTA_LABEL = `Get ${EDITS_PACK.credits} edits — $${EDITS_PACK.priceUsd}`;

interface OutOfCreditsContextValue {
  /** Open the paywall; `trigger` says what was refused, for analytics. */
  show: (trigger: string, balance?: number) => void;
}

const OutOfCreditsContext = createContext<OutOfCreditsContextValue | null>(
  null
);

/**
 * Opens the out-of-credits dialog from anywhere inside it. Outside a
 * provider it falls back to a toast, so a stray caller still says something.
 */
export function useOutOfCredits(): OutOfCreditsContextValue {
  const context = useContext(OutOfCreditsContext);
  return (
    context ?? {
      show: () => toast.error("You're out of edits."),
    }
  );
}

function CheckoutButton({ returnTo }: { returnTo: string }) {
  const [isStarting, setIsStarting] = useState(false);

  return (
    <Button
      className="h-11 w-full rounded-full text-base"
      disabled={isStarting}
      onClick={() => {
        setIsStarting(true);
        startCheckout(returnTo).catch((error: unknown) => {
          setIsStarting(false);
          toast.error(
            error instanceof Error ? error.message : "Checkout failed"
          );
        });
      }}
      type="button"
      variant="brass"
    >
      {isStarting ? <Spinner /> : <span>{CTA_LABEL}</span>}
    </Button>
  );
}

/** A guest signs up first; the room picks checkout up when they return. */
function SignUpThenCheckoutButton({ returnTo }: { returnTo: string }) {
  const separator = returnTo.includes("?") ? "&" : "?";
  const callbackUrl = `${returnTo}${separator}${CHECKOUT_PARAM}=${EDITS_PACK.slug}`;
  const href =
    `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` as Route;

  return (
    <Button
      asChild
      className="h-11 w-full rounded-full text-base"
      variant="brass"
    >
      <Link
        href={href}
        onClick={() =>
          track("checkout_started", {
            credits: EDITS_PACK.credits,
            priceUsd: EDITS_PACK.priceUsd,
          })
        }
      >
        {CTA_LABEL}
      </Link>
    </Button>
  );
}

function OutOfCreditsDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const pathname = usePathname() || "/rooms";
  const isAnonymous = useIsAnonymous();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-6 rounded-2xl border-greige/60 bg-bone p-8 text-ink sm:max-w-sm">
        <DialogHeader className="gap-3 text-center sm:text-center">
          <DialogTitle className="font-normal font-serif text-3xl text-ink">
            Keep designing
          </DialogTitle>
          <DialogDescription className="font-light text-base text-ink/70">
            {EDITS_PACK.credits} edits for ${EDITS_PACK.priceUsd}. They never
            expire.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {isAnonymous ? (
            <>
              <SignUpThenCheckoutButton returnTo={pathname} />
              <p className="text-center font-light text-ink/70 text-xs">
                Create an account to keep your rooms and edits.
              </p>
            </>
          ) : (
            <CheckoutButton returnTo={pathname} />
          )}
          <p className="text-center font-light text-ink/70 text-xs">
            Shopping what's in your room stays free.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A guest who chose to buy was sent to sign up with `?checkout=edits-50` on
 * the way back. Once they are back with an account, carry on to checkout.
 */
function useResumeCheckout() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isAnonymous = useIsAnonymous();
  const started = useRef(false);
  const wantsCheckout = searchParams.get(CHECKOUT_PARAM) === EDITS_PACK.slug;

  useEffect(() => {
    if (!wantsCheckout || isAnonymous !== false || started.current) {
      return;
    }
    started.current = true;
    // Drop the param first so coming back from Polar does not start again.
    router.replace(pathname as Route);
    startCheckout(pathname).catch((error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Checkout failed")
    );
  }, [isAnonymous, pathname, router, wantsCheckout]);
}

/** Holds the out-of-credits dialog for everything that can start a render. */
export function OutOfCreditsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useResumeCheckout();

  const show = useCallback((trigger: string, balance = 0) => {
    track("out_of_credits_shown", { balance, trigger });
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <OutOfCreditsContext.Provider value={value}>
      {children}
      <OutOfCreditsDialog onOpenChange={setOpen} open={open} />
    </OutOfCreditsContext.Provider>
  );
}
