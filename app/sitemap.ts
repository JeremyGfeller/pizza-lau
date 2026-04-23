import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "http://localhost:3000";
  return [
    {
      url: `${base}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/boutique`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/login`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
