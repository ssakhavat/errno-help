import type { MetadataRoute } from "next";

const BASE_URL = "https://errno-help.vercel.app";

const TOOL_PATHS = [
  "/tools/diagnose",
  "/tools/cidr",
  "/tools/dns",
  "/tools/whois",
  "/tools/asn",
  "/tools/geoip",
  "/tools/port-checker",
  "/tools/jwt",
  "/tools/hash",
  "/tools/uuid",
  "/tools/yaml",
  "/tools/cron",
  "/tools/windows-errors",
  "/tools/commands",
  "/tools/robocopy",
  "/tools/chmod",
  "/tools/kubectl",
  "/tools/network",
  "/tools/base64",
  "/tools/url-encode",
  "/tools/regex",
  "/tools/domain-health",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: BASE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: `${BASE_URL}/tools`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...TOOL_PATHS.map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
