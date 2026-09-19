import type { Organization, WebSite, WithContext } from "schema-dts";

export function OrganizationStructuredData() {
  const jsonLd: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
    },
    description:
      "Free AI interior designer providing professional design guidance and room transformations",
    logo: "https://chic.com/logo.png",
    name: "Chic",
    sameAs: [],
    url: "https://chic.com",
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
    description:
      "Free AI-powered interior design tool. Get instant professional design ideas, room layouts, and personalized recommendations.",
    name: "Chic - AI Interior Designer",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://chic.com/search?q={search_term_string}",
    },
    url: "https://chic.com",
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
