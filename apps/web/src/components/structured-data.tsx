import type { Organization, WebSite, WithContext } from "schema-dts";
import { siteConfig } from "@/lib/site-config";

const DESCRIPTION =
  "Chic is an AI room designer: upload a photo of your room, comment to change anything, and shop the real furniture. Free to try.";

export function OrganizationStructuredData() {
  const jsonLd: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: siteConfig.supportUrl,
    },
    description: DESCRIPTION,
    legalName: siteConfig.company,
    logo: `${siteConfig.baseUrl}/logo.png`,
    name: "Chic",
    url: siteConfig.baseUrl,
  };

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data for SEO
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
      type="application/ld+json"
    />
  );
}

export function WebsiteStructuredData() {
  const jsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    description: DESCRIPTION,
    name: "Chic",
    url: siteConfig.baseUrl,
  };

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data for SEO
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
      type="application/ld+json"
    />
  );
}
