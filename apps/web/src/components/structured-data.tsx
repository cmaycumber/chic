import type { Organization, WebSite, WithContext } from "schema-dts";

export function OrganizationStructuredData() {
  const jsonLd: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Chic",
    description:
      "Free AI interior designer providing professional design guidance and room transformations",
    url: "https://chic.com",
    logo: "https://chic.com/logo.png",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
    },
  };

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data for SEO
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="organization-structured-data"
      type="application/ld+json"
    />
  );
}

export function WebsiteStructuredData() {
  const jsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Chic - AI Interior Designer",
    description:
      "Free AI-powered interior design tool. Get instant professional design ideas, room layouts, and personalized recommendations.",
    url: "https://chic.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://chic.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data for SEO
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="website-structured-data"
      type="application/ld+json"
    />
  );
}
