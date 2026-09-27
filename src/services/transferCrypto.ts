/**
 * Hardware-accelerated client-side cryptography for WriteIn device-to-device transfer.
 * Uses Web Crypto API (SubtleCrypto):
 * - Ephemeral ECDH (P-256) keypair generation
 * - HKDF-SHA256 key derivation with session salt
 * - AES-256-GCM authenticated encryption (96-bit random IV)
 * - SHA-256 package checksum verification
 */

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const transferCrypto = {
  /**
   * Generates a new ephemeral ECDH keypair (P-256).
   */
  async generateEphemeralKeypair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );
  },

  /**
   * Exports an ECDH public key to SPKI base64 string for transmission to the relay.
   */
  async exportPublicKey(key: CryptoKey): Promise<string> {
    const spki = await crypto.subtle.exportKey('spki', key);
    return arrayBufferToBase64(spki);
  },

  /**
   * Imports an SPKI base64 string as an ECDH public key.
   */
  async importPublicKey(base64Spki: string): Promise<CryptoKey> {
    const spki = base64ToArrayBuffer(base64Spki);
    return await crypto.subtle.importKey(
      'spki',
      spki as unknown as BufferSource,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  },

  /**
   * Derives an authenticated AES-256-GCM encryption key from local private key and peer's public key
   * using ECDH + HKDF-SHA256 with session salt.
   */
  async deriveSharedKey(
    privateKey: CryptoKey,
    peerPublicKey: CryptoKey,
    sessionSalt: string
  ): Promise<CryptoKey> {
    const sharedBits = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      privateKey,
      256
    );

    const hkdfKey = await crypto.subtle.importKey(
      'raw',
      sharedBits,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    const salt = new TextEncoder().encode(sessionSalt || 'writein-transfer-salt');
    const info = new TextEncoder().encode('writein-transfer-aes-gcm-v1');

    return await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info,
      },
      hkdfKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Encrypts plaintext string using AES-256-GCM with a fresh random 96-bit IV.
   */
  async encryptPayload(
    aesKey: CryptoKey,
    plaintext: string
  ): Promise<{ iv: string; ciphertext: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      aesKey,
      encoded as unknown as BufferSource
    );

    return {
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(cipherBuffer),
    };
  },

  /**
   * Decrypts ciphertext using AES-256-GCM.
   * If ciphertext or tag has been tampered with, throws an error.
   */
  async decryptPayload(
    aesKey: CryptoKey,
    ivBase64: string,
    ciphertextBase64: string
  ): Promise<string> {
    const iv = base64ToArrayBuffer(ivBase64);
    const cipherBytes = base64ToArrayBuffer(ciphertextBase64);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      aesKey,
      cipherBytes as unknown as BufferSource
    );

    return new TextDecoder().decode(decryptedBuffer);
  },

  /**
   * Computes a SHA-256 hexadecimal hash string for integrity checks.
   */
  async computeSha256(text: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      data as unknown as BufferSource
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },
};
