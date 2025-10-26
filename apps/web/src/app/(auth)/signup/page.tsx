"use client";

import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import SignUpForm from "@/components/sign-up-form";

export default function SignupPage() {
  const router = useRouter();

  return (
    <AuthLayout
      subtitle="Start your interior design journey today"
      title="Create your account"
    >
      <SignUpForm onSwitchToSignIn={() => router.push("/login")} />
    </AuthLayout>
  );
}
