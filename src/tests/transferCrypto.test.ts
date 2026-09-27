import { describe, it, expect } from 'vitest';
import { transferCrypto } from '../services/transferCrypto';

describe('transferCrypto: client-side Web Crypto', () => {
  it('generates ephemeral keypairs and exports/imports public keys', async () => {
    const keyPair = await transferCrypto.generateEphemeralKeypair();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();

    const exported = await transferCrypto.exportPublicKey(keyPair.publicKey);
    expect(typeof exported).toBe('string');
    expect(exported.length).toBeGreaterThan(50);

    const imported = await transferCrypto.importPublicKey(exported);
    expect(imported.algorithm.name).toBe('ECDH');
  });

  it('performs ECDH key agreement and derives identical symmetric keys for two parties', async () => {
    const partyA = await transferCrypto.generateEphemeralKeypair();
    const partyB = await transferCrypto.generateEphemeralKeypair();

    const pubA = await transferCrypto.exportPublicKey(partyA.publicKey);
    const pubB = await transferCrypto.exportPublicKey(partyB.publicKey);

    const importedPubB = await transferCrypto.importPublicKey(pubB);
    const importedPubA = await transferCrypto.importPublicKey(pubA);

    const sessionSalt = 'test-session-uuid-12345';

    // Party A derives key K_A using (privA, pubB)
    const keyA = await transferCrypto.deriveSharedKey(partyA.privateKey, importedPubB, sessionSalt);

    // Party B derives key K_B using (privB, pubA)
    const keyB = await transferCrypto.deriveSharedKey(partyB.privateKey, importedPubA, sessionSalt);

    // Encrypt with keyA, decrypt with keyB
    const message = JSON.stringify({
      title: 'The Starlight Odyssey',
      chapters: 24,
      author: 'A. C. Clarke',
    });

    const { iv, ciphertext } = await transferCrypto.encryptPayload(keyA, message);
    expect(iv).toBeDefined();
    expect(ciphertext).toBeDefined();

    const decrypted = await transferCrypto.decryptPayload(keyB, iv, ciphertext);
    expect(decrypted).toBe(message);
    const parsed = JSON.parse(decrypted);
    expect(parsed.title).toBe('The Starlight Odyssey');
  });

  it('detects tampering and rejects altered ciphertext (AES-256-GCM auth tag check)', async () => {
    const partyA = await transferCrypto.generateEphemeralKeypair();
    const partyB = await transferCrypto.generateEphemeralKeypair();

    const sessionSalt = 'salt-for-tamper-test';
    const keyA = await transferCrypto.deriveSharedKey(partyA.privateKey, partyB.publicKey, sessionSalt);
    const keyB = await transferCrypto.deriveSharedKey(partyB.privateKey, partyA.publicKey, sessionSalt);

    const original = 'Secret sensitive chapter content';
    const { iv, ciphertext } = await transferCrypto.encryptPayload(keyA, original);

    // Tamper with ciphertext by altering a character
    const tampered =
      ciphertext.substring(0, 10) +
      (ciphertext[10] === 'A' ? 'B' : 'A') +
      ciphertext.substring(11);

    await expect(transferCrypto.decryptPayload(keyB, iv, tampered)).rejects.toThrow();
  });

  it('computes deterministic SHA-256 checksums', async () => {
    const payload = 'WriteIn Transfer Package v1.0.0 Content';
    const hash1 = await transferCrypto.computeSha256(payload);
    const hash2 = await transferCrypto.computeSha256(payload);
    const hashOther = await transferCrypto.computeSha256(payload + '!');

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
    expect(hash1).not.toBe(hashOther);
  });
});
