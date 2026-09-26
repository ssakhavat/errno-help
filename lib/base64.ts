export interface ConvertError {
  error: string;
}

export function textToBase64(input: string): string | ConvertError {
  if (!input) {
    return { error: "Type or paste some text to encode." };
  }
  try {
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  } catch (err) {
    return { error: `Could not encode this text: ${(err as Error).message}` };
  }
}

export function base64ToText(input: string): string | ConvertError {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (!trimmed) {
    return { error: "Paste some Base64 to decode." };
  }
  let binary: string;
  try {
    binary = atob(trimmed);
  } catch {
    return {
      error: "Invalid Base64 — it contains characters outside the Base64 alphabet.",
    };
  }
  try {
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { error: "Decoded bytes aren't valid UTF-8 text." };
  }
}

export function isConvertError(
  result: string | ConvertError,
): result is ConvertError {
  return typeof result !== "string";
}
