"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "convex/react";
import { memo, useEffect, useMemo, useState } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { siteConfig } from "@/lib/site-config";

const MIN_CREDITS = 10;
const MAX_CREDITS = 2000;
const CREDIT_PRICE_CENTS = 10; // $0.10 per credit
const CENT_MULTIPLIER = 100;

const DEFAULT_CREDITS = 100;

const formSchema = z.object({
  credits: z.array(z.number().min(MIN_CREDITS).max(MAX_CREDITS)).length(1),
});

interface CreditPurchaseModalProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const CreditSliderField = memo(
  ({ control }: { control: Control<z.infer<typeof formSchema>> }) => (
    <FormField
      control={control}
      name="credits"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="credit-slider">Select credits</FormLabel>
          <FormControl>
            <Slider
              className="py-6"
              defaultValue={[DEFAULT_CREDITS]}
              id="credit-slider"
              max={MAX_CREDITS}
              min={MIN_CREDITS}
              onValueChange={(value) => field.onChange(value)}
              step={10}
            />
          </FormControl>
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>{MIN_CREDITS}</span>
            <span>{MAX_CREDITS}</span>
          </div>
        </FormItem>
      )}
    />
  )
);

CreditSliderField.displayName = "CreditSliderField";

const CreditDisplay = ({
  control,
}: {
  control: Control<z.infer<typeof formSchema>>;
}) => {
  const credits = useWatch({
    control,
    name: "credits",
  });

  const formattedPrice = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        currency: "USD",
        style: "currency",
      }).format(
        ((credits?.[0] || DEFAULT_CREDITS) * CREDIT_PRICE_CENTS) /
          CENT_MULTIPLIER
      ),
    [credits]
  );

  return (
    <div className="text-center">
      <p className="font-bold text-4xl">{credits?.[0] || 0} credits</p>
      <p className="text-lg text-muted-foreground">{formattedPrice}</p>
    </div>
  );
};

export function CreditPurchaseModal({
  open,
  onOpenChange,
}: CreditPurchaseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const createCreditCheckout = useAction(api.polar.createCreditCheckout);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      credits: [DEFAULT_CREDITS],
    },
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessing(true);
    try {
      const { url } = await createCreditCheckout({
        credits: values.credits[0] ?? DEFAULT_CREDITS,
        successUrl: `${siteConfig.baseUrl}/success`,
      });
      window.location.href = url;
    } catch {
      // Ideally show a toast error here
      setIsProcessing(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Choose how many credits you want to add to your account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <CreditDisplay control={form.control} />

            <CreditSliderField control={form.control} />

            <DialogFooter className="sm:gap-0">
              <div className="flex w-full justify-between">
                <Button
                  className="w-full sm:w-auto"
                  disabled={isProcessing}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="destructive"
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  disabled={isProcessing}
                  type="submit"
                >
                  {isProcessing ? "Redirecting..." : "Checkout"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
