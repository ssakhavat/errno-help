export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export interface PasswordError {
  error: string;
}

const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~",
};

export function buildCharset(
  options: Omit<PasswordOptions, "length">,
): string {
  let charset = "";
  if (options.lowercase) charset += CHARSETS.lowercase;
  if (options.uppercase) charset += CHARSETS.uppercase;
  if (options.digits) charset += CHARSETS.digits;
  if (options.symbols) charset += CHARSETS.symbols;
  return charset;
}

// Unbiased selection in [0, max) via rejection sampling on crypto.getRandomValues —
// a plain `% max` on a random byte skews low values whenever max doesn't evenly
// divide 256, which silently distorts the character distribution.
function randomIndex(max: number): number {
  const range = 256 - (256 % max);
  const bytes = new Uint8Array(1);
  let value: number;
  do {
    crypto.getRandomValues(bytes);
    value = bytes[0];
  } while (value >= range);
  return value % max;
}

export function generatePassword(
  options: PasswordOptions,
): string | PasswordError {
  if (
    !Number.isInteger(options.length) ||
    options.length < 1 ||
    options.length > 256
  ) {
    return { error: "Length must be an integer between 1 and 256." };
  }

  const charset = buildCharset(options);
  if (charset.length === 0) {
    return { error: "Select at least one character set." };
  }

  let result = "";
  for (let i = 0; i < options.length; i++) {
    result += charset[randomIndex(charset.length)];
  }
  return result;
}

export function generateUuid(): string {
  return crypto.randomUUID();
}
