import windowsErrorsData from "@/data/windows-errors.json";
import windowsEventIdsData from "@/data/windows-event-ids.json";

export interface WindowsError {
  code: string;
  name: string;
  description: string;
}

export interface WindowsEventId {
  id: number;
  log: string;
  name: string;
  description: string;
}

const errors = windowsErrorsData as WindowsError[];
const eventIds = windowsEventIdsData as WindowsEventId[];

function normalizeCode(code: string): string {
  return code.trim().toLowerCase().replace(/^0x/, "");
}

// Codes are stored either as decimal Win32 codes ("5") or hex
// HRESULT/NTSTATUS values ("0x80070005"), so compare them as numbers — a
// string compare after stripping "0x" would wrongly equate 0x10 with 10.
// Negative decimals are signed HRESULTs as some tools print them
// (-2147024891 is 0x80070005).
function codeToNumber(code: string): number | null {
  const t = code.trim();
  if (/^0x[0-9a-f]{1,8}$/i.test(t)) return parseInt(t.slice(2), 16);
  if (/^-?\d{1,10}$/.test(t)) {
    const n = Number(t);
    if (n < -0x80000000 || n > 0xffffffff) return null;
    return n >>> 0;
  }
  return null;
}

const errorsByNumber = new Map<number, WindowsError[]>();
for (const e of errors) {
  const n = codeToNumber(e.code);
  if (n === null) continue;
  const list = errorsByNumber.get(n);
  if (list) list.push(e);
  else errorsByNumber.set(n, [e]);
}

export function findWindowsErrorsByCode(code: string): WindowsError[] {
  const n = codeToNumber(code);
  return n === null ? [] : (errorsByNumber.get(n) ?? []);
}

// Word-by-word AND match rather than one contiguous substring — a query
// like "access denied" should still match text that reads "access is
// denied", which a plain .includes() check would miss.
function matchesAllWords(haystacks: string[], query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const combined = haystacks.join(" ").toLowerCase();
  return words.every((word) => combined.includes(word));
}

export function searchWindowsErrors(query: string): WindowsError[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const numeric = findWindowsErrorsByCode(trimmed);
  if (numeric.length > 0) return numeric;

  // Bare hex without the 0x prefix ("8007000E").
  const normalizedQuery = normalizeCode(trimmed);
  const exact = errors.filter((e) => normalizeCode(e.code) === normalizedQuery);
  if (exact.length > 0) return exact;

  return errors.filter((e) => matchesAllWords([e.name, e.description], trimmed));
}

export function searchEventIds(query: string): WindowsEventId[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (/^\d+$/.test(trimmed)) {
    const idMatch = eventIds.filter((e) => e.id === Number(trimmed));
    if (idMatch.length > 0) return idMatch;
  }

  return eventIds.filter((e) =>
    matchesAllWords([e.log, e.name, e.description], trimmed),
  );
}
