import test from "node:test";
import assert from "node:assert/strict";
import { diagnoseBlob } from "@/lib/diagnose";
import { searchWindowsErrors } from "@/lib/windowsLookup";

// Fixed clock so relative-time details and JWT expiry are deterministic.
const NOW = Date.UTC(2026, 8, 27);

// jwt.io's sample token: {"alg":"HS256","typ":"JWT"} /
// {"sub":"1234567890","name":"John Doe","iat":1516239022}
const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const LOG = `2026-09-27 14:03:11 [ERROR] ts=1790517791 req=5f0c2a1e-8b7d-4c3e-9a21-0e6f4b2d9c11 client=203.0.113.45 upstream=10.12.0.7:8443
  Install failed: HRESULT 0x80070005 (last error 32) while copying; subnet 172.16.40.0/22 acl denied.
  Retry at 1790517851000, checksum sha256=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
  Authorization: Bearer ${JWT}
  version 1.2.3.4.5 build 10.0.19041.1 line 42 port 443 0xDEADBEEF`;

test("mixed log: finds every recognizable value, in order", () => {
  const { findings, truncated } = diagnoseBlob(LOG, NOW);
  assert.equal(truncated, false);
  assert.deepEqual(
    findings.map((f) => `${f.kind}:${f.value}`),
    [
      "timestamp:1790517791",
      "uuid:5f0c2a1e-8b7d-4c3e-9a21-0e6f4b2d9c11",
      "ipv4:203.0.113.45",
      "ipv4:10.12.0.7",
      "windows-error:0x80070005",
      "windows-error:32",
      "cidr:172.16.40.0/22",
      "timestamp:1790517851000",
      "hash:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      "jwt:" + JWT,
      "hex:0xDEADBEEF",
    ],
  );

  const byValue = new Map(findings.map((f) => [f.value, f]));
  const get = (v: string) => byValue.get(v)!;

  // Expected values verified independently (`date -u -d @1790517791`,
  // RFC 5737 / RFC 1918 ranges, the Windows error table).
  assert.equal(get("1790517791").summary, "2026-09-27T14:03:11Z (UTC)");
  assert.equal(get("1790517851000").summary, "2026-09-27T14:04:11Z (UTC)");
  assert.match(get("203.0.113.45").summary, /^Documentation \(TEST-NET-3\)/);
  assert.match(get("10.12.0.7").summary, /^Private \(RFC 1918\)/);
  assert.equal(get("0x80070005").summary, "E_ACCESSDENIED");
  assert.equal(get("32").summary, "ERROR_SHARING_VIOLATION");
  assert.match(get("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08").summary, /SHA-256/);

  const cidr = get("172.16.40.0/22").details.join("\n");
  assert.match(cidr, /Range: 172\.16\.40\.0 – 172\.16\.43\.255/);
  assert.match(cidr, /Usable hosts: 1,022/);

  assert.match(get(JWT).summary, /alg: HS256 · typ: JWT/);
  assert.match(get(JWT).details.join("\n"), /iat: 1516239022 → 2018-01-18T01:30:22\.000Z/);

  // Non-sensitive values deep-link with ?q=.
  assert.equal(get("10.12.0.7").link?.href, "/tools/cidr?q=10.12.0.7%2F32");
  assert.equal(get("0x80070005").link?.href, "/tools/windows-errors?q=0x80070005");
});

test("JWT links never carry the token in the URL", () => {
  const [finding] = diagnoseBlob(JWT, NOW).findings;
  assert.equal(finding.link?.href, "/tools/jwt");
  assert.ok(!finding.link?.href.includes(JWT.slice(0, 20)));
  assert.deepEqual(finding.link?.handoff, { tool: "jwt", value: JWT });
});

test("single-type inputs", () => {
  const first = (s: string) => diagnoseBlob(s, NOW).findings[0];
  assert.equal(first("192.168.1.0/24").kind, "cidr");
  assert.match(first("8.8.8.8").summary, /^Public/);
  assert.equal(first(JWT).kind, "jwt");
  assert.equal(first("0x8007000E").summary, "E_OUTOFMEMORY");
  assert.equal(
    first("550e8400-e29b-41d4-a716-446655440000").summary,
    "Valid UUID format, version 4 (random).",
  );
  assert.equal(
    first("d41d8cd98f00b204e9800998ecf8427e").summary,
    "Looks like the MD5 format (32 hex characters).",
  );
  assert.equal(first("1700000000000").kind, "timestamp");
  // Signed HRESULT as some tools print it: -2147024891 === 0x80070005.
  assert.equal(first("exit code -2147024891").summary, "E_ACCESSDENIED");

  // Listed in the table as its own HRESULT entry: a direct hit.
  const direct = first("0x80070020");
  assert.equal(direct.summary, "ERROR_SHARING_VIOLATION (HRESULT)");
  assert.equal(direct.link?.href, "/tools/windows-errors?q=0x80070020");

  // HRESULT_FROM_WIN32(103): the table only has decimal 103, so this is
  // found by unwrapping the low 16 bits, and links to the Win32 code.
  const wrapped = first("0x80070067");
  assert.equal(wrapped.summary, "ERROR_TOO_MANY_SEM_REQUESTS");
  assert.ok(wrapped.details.includes("HRESULT wrapping Win32 error 103."));
  assert.equal(wrapped.link?.href, "/tools/windows-errors?q=103");
});

test("empty, noise, and repeated input", () => {
  assert.deepEqual(diagnoseBlob("", NOW).findings, []);
  assert.deepEqual(diagnoseBlob("   \n  ", NOW).findings, []);
  // Domains, version strings, out-of-range octets, bare numbers, and
  // 10-digit numbers outside the 2001–2100 window are all ignored.
  assert.deepEqual(
    diagnoseBlob(
      "hello world, line 42, www.example.com, 1.2.3.4.5, 999.1.1.1, 12345, 9999999999",
      NOW,
    ).findings,
    [],
  );

  const repeated = diagnoseBlob("10.0.0.1 10.0.0.1 10.0.0.1", NOW).findings;
  assert.equal(repeated.length, 1);
  assert.equal(repeated[0].count, 3);
});

test("Windows search compares codes numerically", () => {
  // 0x10 is 16, not decimal 10.
  const hex10 = searchWindowsErrors("0x10");
  assert.ok(hex10.length > 0);
  assert.ok(hex10.every((e) => e.code === "16" || e.code.toLowerCase() === "0x10"));
  // Bare hex without the 0x prefix still resolves.
  assert.equal(searchWindowsErrors("8007000E")[0]?.name, "E_OUTOFMEMORY");
  assert.equal(searchWindowsErrors("5")[0]?.name, "ERROR_ACCESS_DENIED");
});
