import { PublicHeader } from "@/components/public-header";
import { ShowcaseHint } from "@/components/showcase-hint";
import { getSessionKind } from "@/lib/auth-server";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Anonymous visitors keep seeing the sign-up invitation.
  const authenticated = (await getSessionKind()) === "account";

  return (
    <>
      <PublicHeader
        center={<ShowcaseHint />}
        isAuthenticated={authenticated}
        variant="floating"
      />
      {children}
    </>
  );
}
