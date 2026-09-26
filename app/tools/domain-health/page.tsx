"use client";

import { useState } from "react";
import Link from "next/link";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

interface DnsSection {
  type: string;
  records: string[] | null;
  error?: string;
}

interface WhoisSection {
  type?: "domain" | "ip";
  name?: string;
  status?: string[];
  nameservers?: string[];
  registrar?: string;
  events?: { action: string; date: string }[];
  error?: string;
}

interface AsnSection {
  asn?: string;
  bgpPrefix?: string;
  countryCode?: string;
  registry?: string;
  allocated?: string;
  asName?: string;
  error?: string;
}

interface GeoIpSection {
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  org?: string;
  timeZone?: string;
  error?: string;
}

interface PortSection {
  port: number;
  open: boolean;
}

interface DomainHealthReport {
  domain: string;
  resolvedIp: string | null;
  dns: DnsSection[];
  whois: WhoisSection;
  asn: AsnSection;
  geoip: GeoIpSection;
  ports: PortSection[] | { error: string };
}

function buildMarkdown(report: DomainHealthReport): string {
  const lines: string[] = [`# Domain health report: ${report.domain}`, ""];

  lines.push(`Resolved IP: ${report.resolvedIp ?? "—"}`, "");

  lines.push("## DNS records", "");
  for (const section of report.dns) {
    if (section.records && section.records.length > 0) {
      lines.push(`- **${section.type}**: ${section.records.join(", ")}`);
    } else {
      lines.push(`- **${section.type}**: none`);
    }
  }
  lines.push("");

  lines.push("## WHOIS", "");
  if (report.whois.error) {
    lines.push(report.whois.error);
  } else {
    if (report.whois.registrar) lines.push(`- Registrar: ${report.whois.registrar}`);
    if (report.whois.status?.length) lines.push(`- Status: ${report.whois.status.join(", ")}`);
    if (report.whois.nameservers?.length)
      lines.push(`- Nameservers: ${report.whois.nameservers.join(", ")}`);
    if (report.whois.events?.length) {
      for (const e of report.whois.events) lines.push(`- ${e.action}: ${e.date}`);
    }
  }
  lines.push("");

  lines.push("## ASN", "");
  if (report.asn.error) {
    lines.push(report.asn.error);
  } else {
    if (report.asn.asn) lines.push(`- ASN: AS${report.asn.asn}`);
    if (report.asn.asName) lines.push(`- Name: ${report.asn.asName}`);
    if (report.asn.countryCode) lines.push(`- Country: ${report.asn.countryCode}`);
    if (report.asn.registry) lines.push(`- Registry: ${report.asn.registry}`);
  }
  lines.push("");

  lines.push("## GeoIP", "");
  if (report.geoip.error) {
    lines.push(report.geoip.error);
  } else {
    if (report.geoip.city) lines.push(`- City: ${report.geoip.city}`);
    if (report.geoip.region) lines.push(`- Region: ${report.geoip.region}`);
    if (report.geoip.country) lines.push(`- Country: ${report.geoip.country}`);
    if (report.geoip.latitude !== undefined && report.geoip.longitude !== undefined)
      lines.push(`- Coordinates: ${report.geoip.latitude}, ${report.geoip.longitude}`);
    if (report.geoip.org) lines.push(`- Org: ${report.geoip.org}`);
  }
  lines.push("");

  lines.push("## Ports", "");
  if (Array.isArray(report.ports)) {
    for (const p of report.ports) {
      lines.push(`- ${p.port}: ${p.open ? "open" : "closed / filtered"}`);
    }
  } else {
    lines.push(report.ports.error);
  }

  return lines.join("\n");
}

function DetailLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="border-b border-line pb-0.5 text-[11px] text-text-faint no-underline hover:border-accent hover:text-accent"
    >
      {label} →
    </Link>
  );
}

export default function DomainHealthPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DomainHealthReport | null>(null);

  async function runReport(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(`/api/domain-health?domain=${encodeURIComponent(domain)}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setReport(json);
      }
    } catch {
      setError("Request failed. Check your connection and try again.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Domain health report
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Runs DNS, WHOIS, ASN, GeoIP, and a common-port check for a domain in
        parallel and combines them into one report. Because a single report
        fans out into around a dozen sub-lookups, this is rate-limited to 5
        reports per minute.
      </p>

      <form onSubmit={runReport} className="mb-8 flex flex-wrap items-center gap-2.5 text-[13.5px]">
        <span className="text-text-faint">domain:</span>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          spellCheck={false}
          className="w-full max-w-[300px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="border-b border-line pb-0.5 font-mono text-[13px] text-text-dim hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {loading ? "Running…" : "Run report →"}
        </button>
        {(domain || report || error) && (
          <ClearButton
            onClick={() => {
              setDomain("");
              setReport(null);
              setError(null);
            }}
          />
        )}
      </form>

      {error && <p className="mb-8 text-[13px] text-accent">{error}</p>}

      {report && (
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <span className="text-[13px] text-text-dim">
              {report.domain}
              {report.resolvedIp && (
                <span className="text-text-faint"> — resolves to {report.resolvedIp}</span>
              )}
            </span>
            <CopyButton value={buildMarkdown(report)} label="Copy as Markdown" />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="m-0 text-[13px] text-text-faint">DNS records</h2>
              <DetailLink href="/tools/dns" label="View in DNS tool" />
            </div>
            <ul className="m-0 list-none border-t border-line p-0">
              {report.dns.map((section) => (
                <li
                  key={section.type}
                  className="flex flex-col gap-1 border-b border-line py-[10px] text-[13px] sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <span className="shrink-0 text-text-faint">{section.type}</span>
                  <span className="break-all text-right font-mono text-text">
                    {section.records && section.records.length > 0
                      ? section.records.join(", ")
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="m-0 text-[13px] text-text-faint">WHOIS</h2>
              <DetailLink href="/tools/whois" label="View in WHOIS tool" />
            </div>
            {report.whois.error ? (
              <p className="m-0 text-[13px] text-text-faint">{report.whois.error}</p>
            ) : (
              <ul className="m-0 list-none border-t border-line p-0">
                {report.whois.registrar && (
                  <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                    <span className="text-text-dim">Registrar</span>
                    <span className="font-mono text-text">{report.whois.registrar}</span>
                  </li>
                )}
                {report.whois.status && report.whois.status.length > 0 && (
                  <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                    <span className="text-text-dim">Status</span>
                    <span className="text-right font-mono text-text">
                      {report.whois.status.join(", ")}
                    </span>
                  </li>
                )}
                {report.whois.nameservers && report.whois.nameservers.length > 0 && (
                  <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                    <span className="text-text-dim">Nameservers</span>
                    <span className="text-right font-mono text-text">
                      {report.whois.nameservers.join(", ")}
                    </span>
                  </li>
                )}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="m-0 text-[13px] text-text-faint">ASN</h2>
              <DetailLink href="/tools/asn" label="View in ASN tool" />
            </div>
            {report.asn.error ? (
              <p className="m-0 text-[13px] text-text-faint">{report.asn.error}</p>
            ) : (
              <ul className="m-0 list-none border-t border-line p-0">
                <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                  <span className="text-text-dim">ASN</span>
                  <span className="font-mono text-text">AS{report.asn.asn}</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                  <span className="text-text-dim">Name</span>
                  <span className="font-mono text-text">{report.asn.asName}</span>
                </li>
                {report.asn.countryCode && (
                  <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                    <span className="text-text-dim">Country</span>
                    <span className="font-mono text-text">{report.asn.countryCode}</span>
                  </li>
                )}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="m-0 text-[13px] text-text-faint">GeoIP</h2>
              <DetailLink href="/tools/geoip" label="View in GeoIP tool" />
            </div>
            {report.geoip.error ? (
              <p className="m-0 text-[13px] text-text-faint">{report.geoip.error}</p>
            ) : (
              <ul className="m-0 list-none border-t border-line p-0">
                {report.geoip.city && (
                  <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                    <span className="text-text-dim">City</span>
                    <span className="font-mono text-text">{report.geoip.city}</span>
                  </li>
                )}
                {report.geoip.country && (
                  <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                    <span className="text-text-dim">Country</span>
                    <span className="font-mono text-text">{report.geoip.country}</span>
                  </li>
                )}
                {report.geoip.org && (
                  <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                    <span className="text-text-dim">Org</span>
                    <span className="font-mono text-text">{report.geoip.org}</span>
                  </li>
                )}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="m-0 text-[13px] text-text-faint">Common ports</h2>
              <DetailLink href="/tools/port-checker" label="View in Port checker" />
            </div>
            {Array.isArray(report.ports) ? (
              <ul className="m-0 list-none border-t border-line p-0">
                {report.ports.map((p) => (
                  <li
                    key={p.port}
                    className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]"
                  >
                    <span className="text-text-dim">{p.port}</span>
                    <span
                      className={`font-mono ${p.open ? "text-text" : "text-text-faint"}`}
                    >
                      {p.open ? "open" : "closed / filtered"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[13px] text-text-faint">{report.ports.error}</p>
            )}
          </section>
        </div>
      )}

      <footer className="mt-10 shrink-0 border-t border-line pt-6 text-[11.5px] text-text-faint">
        DNS and port checks run directly from the server. WHOIS uses RDAP,
        ASN uses Team Cymru&apos;s WHOIS service, and GeoIP data is by{" "}
        <a
          href="https://ipinfo.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-faint underline decoration-line hover:text-accent"
        >
          ipinfo.io
        </a>
        .
      </footer>
    </div>
  );
}
