export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      // biome-ignore lint/style/useNamingConvention: This is a config file for convex
      applicationID: "convex",
    },
  ],
};
