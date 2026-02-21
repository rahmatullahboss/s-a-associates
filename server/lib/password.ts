const HASH_PREFIX = "pbkdf2_sha256";
const PBKDF2_ITERATIONS = 100_000; // Cloudflare Native WebCrypto Max Threshold
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function isPasswordHash(value: string): boolean {
  return value.startsWith(`${HASH_PREFIX}$`);
}

async function deriveHashNative(password: string, salt: Uint8Array, iterations: number = PBKDF2_ITERATIONS): Promise<Uint8Array> {
  const enc = new TextEncoder();
  
  // Fully Native C++ WebCrypto Import
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  // Directly bounds to Cloudflare Backend (Executes outside V8 50ms JS limits)
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt,
      iterations: iterations
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = await deriveHashNative(password, salt);
  return `${HASH_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(password: string, storedValue: string): Promise<boolean> {
  const parts = storedValue.split("$");
  if (parts.length !== 4 || parts[0] !== HASH_PREFIX) return false;

  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  try {
    const salt = base64UrlToBytes(parts[2]);
    const hash = base64UrlToBytes(parts[3]);

    const derivedBytes = await deriveHashNative(password, salt, iterations);
    return timingSafeEqual(derivedBytes, hash);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'NotSupportedError' && iterations > 100000) {
      console.warn(`Attempted to verify legacy ${iterations}k hash which exceeds Cloudflare Native limits. User must reset password.`);
      return false; // Authentication forcibly fails, necessitating password reset for old Django accounts
    }
    throw error;
  }
}
