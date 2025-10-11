"use client";

import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import SignInForm from "@/components/sign-in-form";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthLayout
      subtitle="Sign in to your account to continue"
      title="Welcome back"
    >
      <SignInForm onSwitchToSignUp={() => router.push("/signup")} />
    </AuthLayout>
  );
}
