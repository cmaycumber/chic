import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { getSessionKind } from "@/lib/auth-server";

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Anonymous visitors keep seeing the sign-up invitation.
  const authenticated = (await getSessionKind()) === "account";

  return (
    <div className="min-h-screen">
      <PublicHeader isAuthenticated={authenticated} />
      <main className="pt-14 sm:pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
