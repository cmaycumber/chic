import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "@/global.css";
import { LayoutContent } from "@/components/layout-content";
import Providers from "@/components/providers";
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
} from "@/components/structured-data";
import { ThemeScript } from "@/components/theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chic - AI Interior Designer | Free AI-Powered Interior Design Tool",
  description:
    "Transform your space with Chic, the free AI interior designer. Get instant professional design ideas, room layouts, and personalized recommendations. Chat with our AI design assistant to create your dream home in seconds.",
  keywords: [
    "ai interior designer",
    "ai interior design",
    "free interior design ai",
    "ai room designer",
    "interior design assistant",
    "ai design tool",
  ],
  openGraph: {
    title: "Chic - AI Interior Designer | Free AI-Powered Interior Design",
    description:
      "Transform your space with our free AI interior designer. Get instant professional design ideas and personalized recommendations.",
    type: "website",
    siteName: "Chic",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chic - AI Interior Designer",
    description:
      "Free AI-powered interior design tool. Transform your space in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OrganizationStructuredData />
        <WebsiteStructuredData />
        {isProduction && (
          <Script
            data-key="aGmRY7KESAJ89WT/08OyZA"
            src="https://analytics.ahrefs.com/analytics.js"
            strategy="afterInteractive"
          />
        )}
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
