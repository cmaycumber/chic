"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/auth-layout";
import ResetPasswordForm from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      subtitle="Choose a new password for your account"
      title="Reset your password"
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
