export interface ConvertError {
  error: string;
}

export function encodeUrlText(input: string): string | ConvertError {
  if (!input) {
    return { error: "Type or paste some text to encode." };
  }
  return encodeURIComponent(input);
}

export function decodeUrlText(input: string): string | ConvertError {
  if (!input.trim()) {
    return { error: "Paste an encoded string to decode." };
  }
  try {
    return decodeURIComponent(input);
  } catch {
    return {
      error: "Invalid percent-encoding — check for a stray or incomplete % sequence.",
    };
  }
}

export function isConvertError(
  result: string | ConvertError,
): result is ConvertError {
  return typeof result !== "string";
}
