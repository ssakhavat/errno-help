export interface RegexMatch {
  match: string;
  index: number;
  groups: (string | undefined)[];
}

export interface RegexTestResult {
  matches: RegexMatch[];
}

export interface RegexTestError {
  error: string;
}

// Caps how many matches we collect so a pathological pattern (or a huge
// input) can't lock up the tab while the user is still mid-keystroke.
const MAX_MATCHES = 5000;

export function testRegex(
  pattern: string,
  flags: string,
  input: string,
): RegexTestResult | RegexTestError {
  if (!pattern) {
    return { matches: [] };
  }

  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const matches: RegexMatch[] = [];

  if (re.global) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null && matches.length < MAX_MATCHES) {
      matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
      // Zero-length matches (e.g. /x*/) don't advance lastIndex on their
      // own, which would otherwise spin the loop forever on the same spot.
      if (m[0].length === 0) {
        re.lastIndex += 1;
      }
    }
  } else {
    const m = re.exec(input);
    if (m) {
      matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
    }
  }

  return { matches };
}

export function isRegexError(
  result: RegexTestResult | RegexTestError,
): result is RegexTestError {
  return "error" in result;
}

export interface HighlightSegment {
  text: string;
  matched: boolean;
}

export function buildHighlightSegments(
  input: string,
  matches: RegexMatch[],
): HighlightSegment[] {
  if (matches.length === 0) {
    return input ? [{ text: input, matched: false }] : [];
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.index > cursor) {
      segments.push({ text: input.slice(cursor, m.index), matched: false });
    }
    if (m.match.length > 0) {
      segments.push({ text: m.match, matched: true });
    }
    cursor = Math.max(cursor, m.index + m.match.length);
  }
  if (cursor < input.length) {
    segments.push({ text: input.slice(cursor), matched: false });
  }
  return segments;
}
