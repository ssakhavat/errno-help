export const HASH_ALGORITHMS = [
  "MD5",
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
] as const;

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function digest(
  algorithm: HashAlgorithm,
  text: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  if (algorithm === "MD5") {
    return md5Hex(bytes);
  }
  const buffer = await crypto.subtle.digest(algorithm, bytes);
  return toHex(buffer);
}

// --- MD5 (RFC 1321) ---
// The Web Crypto API deliberately does not implement MD5 (it's broken for
// security use), but it's still commonly used for non-security checksums,
// so a small local implementation covers that case.

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
  9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
  15, 21,
];

const K = Uint32Array.from({ length: 64 }, (_, i) =>
  Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32),
);

function leftRotate(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0;
}

function toLittleEndianHex(n: number): string {
  const bytes = [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function md5Hex(input: Uint8Array): string {
  const originalLength = input.length;
  const bitLength = originalLength * 8;

  let paddedLength = originalLength + 1;
  while (paddedLength % 64 !== 56) paddedLength++;

  const message = new Uint8Array(paddedLength + 8);
  message.set(input);
  message[originalLength] = 0x80;

  const view = new DataView(message.buffer);
  view.setUint32(paddedLength, bitLength >>> 0, true);
  view.setUint32(paddedLength + 4, Math.floor(bitLength / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < message.length; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + leftRotate(F, S[i])) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  return [a0, b0, c0, d0].map(toLittleEndianHex).join("");
}
