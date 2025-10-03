import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import { AppSidebar } from "@/components/app-sidebar";
import Providers from "@/components/providers";
import { SidebarProvider } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "furnish",
  description: "furnish",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SidebarProvider>
            <div className="flex h-svh w-full bg-background">
              <AppSidebar />
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
