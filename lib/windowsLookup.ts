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
