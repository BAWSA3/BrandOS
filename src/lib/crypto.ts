// ============================================================================
// crypto — envelope encryption for OAuth tokens
//
// Used to encrypt X (and future platform) OAuth access/refresh tokens before
// storing them in the PlatformConnection table.
//
// Algorithm: libsodium secretbox (XSalsa20-Poly1305 authenticated encryption).
//
// Key management:
//   - Master key lives in env as X_OAUTH_ENCRYPTION_KEY (32 bytes, base64url)
//   - Each ciphertext is tagged with a key_id ("v1" today) so we can rotate
//     the master key without re-encrypting every row immediately. A background
//     job re-encrypts rows in batches when the key version increments.
//
// Phase 9 plan: migrate master key from env var to AWS/GCP KMS within 30 days
// of first paying customer. See docs/SECURITY-HARDENING.md Phase 9.
//
// Required dependency (not yet installed — add manually):
//   npm i libsodium-wrappers
//   npm i -D @types/libsodium-wrappers
// ============================================================================

import sodium from 'libsodium-wrappers';

const CURRENT_KEY_ID = 'v1';

let sodiumReady = false;
async function ensureSodiumReady(): Promise<void> {
  if (sodiumReady) return;
  await sodium.ready;
  sodiumReady = true;
}

function getMasterKey(keyId: string): Uint8Array {
  // Today only one key version exists. When rotating, switch on keyId here
  // to look up the historical key from env (X_OAUTH_ENCRYPTION_KEY_V1, _V2, etc).
  if (keyId !== CURRENT_KEY_ID) {
    throw new Error(`Unknown encryption key_id: ${keyId}`);
  }

  const raw = process.env.X_OAUTH_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'X_OAUTH_ENCRYPTION_KEY is not set. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"',
    );
  }

  const key = sodium.from_base64(raw, sodium.base64_variants.URLSAFE_NO_PADDING);
  if (key.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error(
      `X_OAUTH_ENCRYPTION_KEY must decode to ${sodium.crypto_secretbox_KEYBYTES} bytes, got ${key.length}`,
    );
  }

  return key;
}

export interface EncryptedToken {
  ciphertext: string; // base64url: nonce || encrypted_bytes
  keyId: string;
}

/**
 * Encrypts a plaintext OAuth token. Returns the ciphertext and the key_id
 * used to encrypt — both must be persisted so we can decrypt later.
 */
export async function encryptOauthToken(plaintext: string): Promise<EncryptedToken> {
  await ensureSodiumReady();

  const key = getMasterKey(CURRENT_KEY_ID);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = sodium.from_string(plaintext);
  const encrypted = sodium.crypto_secretbox_easy(message, nonce, key);

  // Pack as nonce || encrypted, base64url-encoded
  const packed = new Uint8Array(nonce.length + encrypted.length);
  packed.set(nonce, 0);
  packed.set(encrypted, nonce.length);

  return {
    ciphertext: sodium.to_base64(packed, sodium.base64_variants.URLSAFE_NO_PADDING),
    keyId: CURRENT_KEY_ID,
  };
}

/**
 * Decrypts an OAuth token ciphertext using the key version it was encrypted with.
 */
export async function decryptOauthToken(ciphertext: string, keyId: string): Promise<string> {
  await ensureSodiumReady();

  const key = getMasterKey(keyId);
  const packed = sodium.from_base64(ciphertext, sodium.base64_variants.URLSAFE_NO_PADDING);

  const nonce = packed.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const encrypted = packed.slice(sodium.crypto_secretbox_NONCEBYTES);

  const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, key);
  return sodium.to_string(decrypted);
}

/**
 * Returns the current encryption key version. Persist this alongside any
 * ciphertext you produce so the decrypt path can find the right key later.
 */
export function getCurrentKeyId(): string {
  return CURRENT_KEY_ID;
}
