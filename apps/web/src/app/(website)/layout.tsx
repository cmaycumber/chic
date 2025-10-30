import { cookies } from "next/headers";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("better-auth.session_token");
  const isAuthenticated = !!sessionCookie?.value;

  return (
    <div className="min-h-screen">
      <PublicHeader isAuthenticated={isAuthenticated} />
      <main className="pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
