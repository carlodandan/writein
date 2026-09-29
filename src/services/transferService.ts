import { invokeCommand } from './tauriIpc';
import { transferCrypto } from './transferCrypto';
import { transferClient } from './transferClient';
import type {
  LibraryTransferPackage,
  TransferLogItem,
  TransferStats,
} from '../types/transfer';

export interface ActiveSenderSession {
  sessionId: string;
  code: string;
  expiresAt: number;
  confirmSas: () => void;
  cancel: () => Promise<void>;
}

export interface ActiveReceiverSession {
  sas: string;
  sessionId: string;
  expiresAt: number;
  fetchPayloadAndPreview: () => Promise<{
    stats: TransferStats;
    executeImport: () => Promise<TransferStats>;
  }>;
  confirmSas: () => void;
  cancel: () => Promise<void>;
}

export const transferService = {
  /**
   * Retrieves or initializes this installation's persistent device UUID.
   */
  async getDeviceId(): Promise<string> {
    return invokeCommand<string>('get_device_id');
  },

  /**
   * Lists recent device transfer history logs.
   */
  async listTransferLogs(): Promise<TransferLogItem[]> {
    return invokeCommand<TransferLogItem[]>('list_transfer_logs');
  },

  /**
   * Starts a sender session:
   * 1. Generates ephemeral ECDH keypair
   * 2. Registers session with relay to receive a pairing code
   * 3. Polls until receiver claims with their public key
   * 4. Exports library, encrypts locally with AES-256-GCM, and uploads ciphertext
   */
  async startSenderSession(
    onStatusChange: (status: string, details?: any) => void,
    relayUrl?: string
  ): Promise<ActiveSenderSession> {
    // 1. Generate ephemeral keypair
    const keyPair = await transferCrypto.generateEphemeralKeypair();
    const sourcePubBase64 = await transferCrypto.exportPublicKey(keyPair.publicKey);

    // 2. Register session
    const createResp = await transferClient.createSession(sourcePubBase64, relayUrl);
    const { sessionId, code, expiresAt } = createResp;

    let isCancelled = false;
    let isFinished = false;
    let peerPublicKey: string | null = null;
    let sas: string | null = null;
    let sasConfirmed = false;
    const confirmSas = () => {
      if (sas && !isCancelled && !isFinished && Date.now() < expiresAt) sasConfirmed = true;
    };

    const cancel = async () => {
      isCancelled = true;
      try {
        await transferClient.cancelTransfer(sessionId, relayUrl);
      } catch {
        // ignore if already closed
      }
    };

    // 3. Poller in background
    (async () => {
      try {
        let hasUploaded = false;

        while (!isCancelled && !isFinished && Date.now() < expiresAt) {
          const status = await transferClient.getStatus(sessionId, relayUrl);

          if (isCancelled) break;

          if (status.status === 'CANCELLED') {
            isFinished = true;
            onStatusChange('CANCELLED');
            break;
          }

          if (status.status === 'CLAIMED' && !hasUploaded && status.destinationPublicKey) {
            if (!peerPublicKey) {
              peerPublicKey = status.destinationPublicKey;
              sas = await transferCrypto.computeSas(sessionId, sourcePubBase64, peerPublicKey);
              if (isCancelled) break;
              onStatusChange('VERIFYING', sas);
            }
            if (!sasConfirmed) {
              await new Promise((r) => setTimeout(r, 1500));
              continue;
            }
            if (Date.now() >= expiresAt) break;
            onStatusChange('ENCRYPTING');

            // Derive shared key
            const destPubKey = await transferCrypto.importPublicKey(peerPublicKey);
            const aesKey = await transferCrypto.deriveSharedKey(
              keyPair.privateKey,
              destPubKey,
              sessionId
            );

            // Export library from local SQLite
            const libraryPackage = await invokeCommand<LibraryTransferPackage>(
              'export_library_transfer_package'
            );

            // Package into JSON & encrypt
            const packageJson = JSON.stringify(libraryPackage);
            const checksum = await transferCrypto.computeSha256(packageJson);
            libraryPackage.manifest.checksumSha256 = checksum;

            const finalJson = JSON.stringify(libraryPackage);
            const { iv, ciphertext } = await transferCrypto.encryptPayload(aesKey, finalJson);

            if (isCancelled || Date.now() >= expiresAt) break;
            onStatusChange('UPLOADING');
            await transferClient.uploadPayload(
              sessionId,
              iv,
              ciphertext,
              libraryPackage.manifest.stats,
              relayUrl
            );

            if (isCancelled) break;
            hasUploaded = true;
            onStatusChange('READY', libraryPackage.manifest.stats);
          }

          if (status.status === 'COMPLETED') {
            isFinished = true;
            onStatusChange('COMPLETED');
            break;
          }

          await new Promise((r) => setTimeout(r, 1500));
        }

        if (Date.now() >= expiresAt && !isFinished && !isCancelled) {
          onStatusChange('EXPIRED');
        }
      } catch (err: any) {
        if (!isCancelled) {
          onStatusChange('ERROR', err?.message || String(err));
        }
      }
    })();

    return { sessionId, code, expiresAt, confirmSas, cancel };
  },

  /**
   * Connects to a transfer session as the receiver:
   * 1. Generates ephemeral ECDH keypair
   * 2. Claims session using pairing code
   * 3. Derives shared AES-256-GCM key
   * 4. Awaits payload upload, downloads, decrypts, and imports
   */
  async claimAndConnect(
    code: string,
    relayUrl?: string
  ): Promise<ActiveReceiverSession> {
    const keyPair = await transferCrypto.generateEphemeralKeypair();
    const destPubBase64 = await transferCrypto.exportPublicKey(keyPair.publicKey);

    const claimResp = await transferClient.claimSession(code, destPubBase64, relayUrl);
    const { sessionId, sourcePublicKey, expiresAt } = claimResp;

    const sas = await transferCrypto.computeSas(sessionId, sourcePublicKey, destPubBase64);
    const sourcePubKey = await transferCrypto.importPublicKey(sourcePublicKey);
    const aesKey = await transferCrypto.deriveSharedKey(
      keyPair.privateKey,
      sourcePubKey,
      sessionId
    );

    let isCancelled = false;
    let sasConfirmed = false;
    const confirmSas = () => {
      if (!isCancelled && Date.now() < expiresAt) sasConfirmed = true;
    };
    const assertActive = () => {
      if (isCancelled) throw new Error('Transfer was cancelled');
      if (Date.now() >= expiresAt) throw new Error('Transfer session expired');
    };
    const cancel = async () => {
      isCancelled = true;
      try {
        await transferClient.cancelTransfer(sessionId, relayUrl);
      } catch {
        // ignore
      }
    };

    const fetchPayloadAndPreview = async () => {
      // Poll until payload is ready
      while (!isCancelled && Date.now() < expiresAt) {
        const status = await transferClient.getStatus(sessionId, relayUrl);
        if (status.status === 'CANCELLED') {
          throw new Error('Transfer was cancelled by the sending device');
        }
        if (status.status === 'READY' && status.hasPayload) {
          break;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }

      if (isCancelled) throw new Error('Transfer was cancelled');

      if (Date.now() >= expiresAt) {
        throw new Error('Transfer session expired before payload was uploaded');
      }

      // Download encrypted payload
      const payloadResp = await transferClient.downloadPayload(sessionId, relayUrl);

      // Decrypt locally using AES-256-GCM
      const decryptedJson = await transferCrypto.decryptPayload(
        aesKey,
        payloadResp.iv,
        payloadResp.ciphertext
      );

      const parsedPackage: LibraryTransferPackage = JSON.parse(decryptedJson);

      // Validate integrity if checksum present
      if (parsedPackage.manifest.checksumSha256) {
        const originalChecksum = parsedPackage.manifest.checksumSha256;
        parsedPackage.manifest.checksumSha256 = null;
        const recomputed = await transferCrypto.computeSha256(JSON.stringify(parsedPackage));
        if (originalChecksum !== recomputed) {
          console.warn('Checksum mismatch, but payload was authenticated by AES-GCM.');
        }
      }

      assertActive();
      const stats = parsedPackage.manifest.stats;

      const executeImport = async (): Promise<TransferStats> => {
        assertActive();
        if (!sasConfirmed) throw new Error('Confirm the matching verification code before importing');
        const importedStats = await invokeCommand<TransferStats>(
          'import_library_transfer_package',
          { packageJson: decryptedJson }
        );

        // The local import is committed even if relay notification fails.
        try {
          await transferClient.completeTransfer(sessionId, relayUrl);
        } catch {
          // Best-effort notification must not turn a committed import into a failure.
        }
        return importedStats;
      };

      return { stats, executeImport };
    };

    return { sessionId, expiresAt, sas, confirmSas, fetchPayloadAndPreview, cancel };
  },
};
