export interface CommonPort {
  port: number;
  name: string;
}

// A curated allowlist of common/well-known ports. Restricting to these
// keeps the port checker from doubling as a general-purpose port scanner —
// the highest-abuse-risk tool on the site. Shared between the server route
// (enforced) and the client UI (offered as choices).
export const ALLOWED_PORTS: CommonPort[] = [
  { port: 21, name: "FTP" },
  { port: 22, name: "SSH" },
  { port: 23, name: "Telnet" },
  { port: 25, name: "SMTP" },
  { port: 53, name: "DNS" },
  { port: 80, name: "HTTP" },
  { port: 110, name: "POP3" },
  { port: 143, name: "IMAP" },
  { port: 443, name: "HTTPS" },
  { port: 465, name: "SMTPS" },
  { port: 587, name: "SMTP (submission)" },
  { port: 993, name: "IMAPS" },
  { port: 995, name: "POP3S" },
  { port: 3306, name: "MySQL" },
  { port: 3389, name: "RDP" },
  { port: 5432, name: "PostgreSQL" },
  { port: 6379, name: "Redis" },
  { port: 8080, name: "HTTP (alt)" },
  { port: 8443, name: "HTTPS (alt)" },
  { port: 27017, name: "MongoDB" },
];
