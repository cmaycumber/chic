import { AppHeader } from "@/components/app-header";
import { AuthGate } from "@/components/auth-gate";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <div className="min-h-screen w-full bg-background">
        <AppHeader />
        <main className="w-full pt-24">{children}</main>
      </div>
    </AuthGate>
  );
}
