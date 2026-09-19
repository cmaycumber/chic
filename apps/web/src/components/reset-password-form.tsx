"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const form = useForm({
    defaultValues: {
      confirmPassword: "",
      newPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        return;
      }
      await authClient.resetPassword(
        {
          newPassword: value.newPassword,
          token,
        },
        {
          onError: (err) => {
            toast.error(err.error.message || err.error.statusText);
          },
          onSuccess: () => {
            toast.success("Password reset. Sign in with your new password.");
            router.push("/login");
          },
        }
      );
    },
    validators: {
      onSubmit: z
        .object({
          confirmPassword: z.string(),
          newPassword: z
            .string()
            .min(
              MIN_PASSWORD_LENGTH,
              `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
            ),
        })
        .refine((value) => value.newPassword === value.confirmPassword, {
          error: "Passwords don't match",
          path: ["confirmPassword"],
        }),
    },
  });

  if (error || !token) {
    return (
      <div className="space-y-4 text-center">
        <p className="font-medium text-lg">This link is invalid or expired</p>
        <p className="text-muted-foreground text-sm">
          Password reset links only work once and expire after a while.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div>
          <form.Field name="newPassword">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>New password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((fieldError) => (
                  <p className="text-error text-sm" key={fieldError?.message}>
                    {fieldError?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="confirmPassword">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Confirm password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((fieldError) => (
                  <p className="text-error text-sm" key={fieldError?.message}>
                    {fieldError?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
              type="submit"
            >
              {state.isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
