import type { Metadata } from "next";
import Link from "next/link";
import type { WebApplication, WithContext } from "schema-dts";
import { HomeShowcase } from "@/components/home-showcase";
import { RoomComposerBar } from "@/components/room-composer-bar";
import { siteConfig } from "@/lib/site-config";

const TITLE = "Free AI Room Designer: Redesign Your Room From a Photo";
const DESCRIPTION =
  "Upload a photo of your room and comment to change anything. See the redesign in about 20 seconds, then shop the real furniture. Free to try, no sign-up.";

export const metadata: Metadata = {
  alternates: { canonical: `${siteConfig.baseUrl}/` },
  description: DESCRIPTION,
  openGraph: {
    description: DESCRIPTION,
    images: [
      {
        alt: "Chic AI room designer: upload a photo, comment to change it, shop the look",
        height: 630,
        url: "/images/ai-room-designer-hero.png",
        width: 1200,
      },
    ],
    siteName: "Chic",
    title: TITLE,
    type: "website",
    url: `${siteConfig.baseUrl}/`,
  },
  title: `${TITLE} | Chic`,
  twitter: {
    card: "summary_large_image",
    description: DESCRIPTION,
    images: ["/images/ai-room-designer-hero.png"],
    title: TITLE,
  },
};

const webApplicationJsonLd: WithContext<WebApplication> = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  applicationCategory: "DesignApplication",
  description: DESCRIPTION,
  name: "Chic",
  offers: [
    {
      "@type": "Offer",
      description: "3 free edits to start",
      price: "0",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      description: "50 edits",
      price: "5",
      priceCurrency: "USD",
    },
  ],
  operatingSystem: "Web",
  publisher: {
    "@type": "Organization",
    name: siteConfig.company,
  },
  url: `${siteConfig.baseUrl}/`,
};

const FOOTER_LINKS = [
  { href: "/ideas", label: "Room ideas" },
  { href: "/blog", label: "Blog" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/support", label: "Support" },
] as const;

export default function HomePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data for SEO
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationJsonLd),
        }}
        type="application/ld+json"
      />
      {/* The page's visible copy lives in the photo and composer, so the
          heading is for search engines and screen readers only. */}
      <h1 className="sr-only">
        Chic: free AI room designer. Redesign your room from a photo.
      </h1>
      <HomeShowcase />

      {/* Bottom-anchored composer column */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <RoomComposerBar className="mx-auto w-full max-w-2xl" />

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-white/50 text-xs">
          <span>
            © {new Date().getFullYear()} {siteConfig.company}
          </span>
          {FOOTER_LINKS.map((link) => (
            <Link
              className="hover:text-white/80"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <a
            className="hover:text-white/80"
            href="https://unsplash.com/@spacejoy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Photo: Spacejoy / Unsplash
          </a>
        </footer>
      </div>
    </div>
  );
}
