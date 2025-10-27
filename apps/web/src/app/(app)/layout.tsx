import { LayoutContent } from "@/components/layout-content";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LayoutContent>{children}</LayoutContent>;
}
