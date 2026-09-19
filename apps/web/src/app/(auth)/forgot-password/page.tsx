"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/auth-layout";
import ForgotPasswordForm from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      subtitle="We'll email you a link to reset it"
      title="Forgot your password?"
    >
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
