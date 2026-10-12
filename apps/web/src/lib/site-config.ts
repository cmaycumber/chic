const baseUrl = "https://www.usechic.com";

export const siteConfig = {
  baseUrl,
  /** The legal operator of Chic, and the publisher of its ChatGPT app. */
  company: "Automatons, LLC",
  domain: "usechic.com",
  indexNowKey: "qdze4waf89k3n3fdfs3gzf8kx6adys6k",
  privacyUrl: `${baseUrl}/privacy`,
  // The only inbox that works today; move to a support@usechic.com inbox.
  supportEmail: "chad.maycumber11@gmail.com",
  supportUrl: `${baseUrl}/support`,
  tagline: "Upload a photo. Comment to change it. Shop the look.",
  termsUrl: `${baseUrl}/terms`,
} as const;
