import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "@/global.css";
import { ThemeProvider } from "next-themes";
import { IdentifyUser } from "@/components/identify-user";
import Providers from "@/components/providers";
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
} from "@/components/structured-data";
import { getToken } from "@/lib/auth-server";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  description:
    "Transform your space with Chic. Upload a photo of your room, comment on what you'd change, and shop the furniture on Amazon.",
  keywords: [
    "ai interior designer",
    "ai interior design",
    "free interior design ai",
    "ai room designer",
    "room makeover",
    "ai design tool",
  ],
  openGraph: {
    description:
      "Transform your space with our free AI interior designer. Get instant professional design ideas and personalized recommendations.",
    images: [
      {
        alt: "Chic AI Interior Designer - Transform your space with AI",
        height: 630,
        url: "/images/ai-room-designer-hero.png",
        width: 1200,
      },
    ],
    siteName: "Chic",
    title: "Chic - AI Interior Designer | Free AI-Powered Interior Design",
    type: "website",
  },
  title: "Chic - AI Interior Designer | Free AI-Powered Interior Design Tool",
  twitter: {
    card: "summary_large_image",
    description:
      "Free AI-powered interior design tool. Transform your space in seconds.",
    images: ["/images/ai-room-designer-hero.png"],
    title: "Chic - AI Interior Designer",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === "production";
  const initialToken = (await getToken()) ?? null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OrganizationStructuredData />
        <WebsiteStructuredData />
        {isProduction && (
          <>
            <Script
              data-key="aGmRY7KESAJ89WT/08OyZA"
              src="https://analytics.ahrefs.com/analytics.js"
              strategy="afterInteractive"
            />
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-4KRV5FLCHW"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-4KRV5FLCHW');
              `}
            </Script>
          </>
        )}

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          // Just going to force light mode for now
          forcedTheme="light"
          storageKey="theme"
        >
          <Providers initialToken={initialToken}>
            {children}
            <IdentifyUser />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
