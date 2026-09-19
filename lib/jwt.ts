export interface DecodedJwt {
  header: unknown;
  payload: unknown;
  signaturePresent: boolean;
}

export interface JwtError {
  error: string;
}

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function decodeJwt(token: string): DecodedJwt | JwtError {
  const trimmed = token.trim();
  if (!trimmed) {
    return { error: "Paste a JWT to decode it." };
  }

  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return {
      error: `A JWT has 3 dot-separated parts (header.payload.signature); found ${parts.length}.`,
    };
  }
  const [headerPart, payloadPart, signaturePart] = parts;

  let header: unknown;
  try {
    header = JSON.parse(base64UrlDecode(headerPart));
  } catch {
    return {
      error: "Could not decode the header — it isn't valid base64url JSON.",
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart));
  } catch {
    return {
      error: "Could not decode the payload — it isn't valid base64url JSON.",
    };
  }

  return { header, payload, signaturePresent: signaturePart.length > 0 };
}

export function isJwtError(
  result: DecodedJwt | JwtError,
): result is JwtError {
  return "error" in result;
}
