import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferClient } from '../services/transferClient';
import { transferCrypto } from '../services/transferCrypto';
import { invokeCommand } from '../services/tauriIpc';
import { APP_VERSION } from '../utils/version';
import type { LibraryTransferPackage } from '../types/transfer';
import { transferService } from '../services/transferService';

describe('transferService client operations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves persistent device id', async () => {
    const devId = await transferService.getDeviceId();
    expect(devId).toBeDefined();
    expect(devId.length).toBeGreaterThan(5);

    const devId2 = await transferService.getDeviceId();
    expect(devId).toBe(devId2);
  });

  it('exports the current app version in browser mode', async () => {
    const pkg = await invokeCommand<LibraryTransferPackage>('export_library_transfer_package');
    expect(pkg.manifest.writeinVersion).toBe(APP_VERSION);
  });

  it('lists transfer logs array', async () => {
    const logs = await transferService.listTransferLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it.each([false, true])('transfers only after confirmation (completion notification fails: %s)', async (notificationFails) => {
    // In-memory mock relay session store
    let sessionStore: any = null;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init?: any) => {
      const urlStr = String(url);
      const method = init?.method || 'GET';
      const body = init?.body ? JSON.parse(init.body) : {};

      if (urlStr.includes('/api/transfer/create') && method === 'POST') {
        sessionStore = {
          sessionId: 'sess-test-1',
          code: '8F4K-92QX',
          status: 'CREATED',
          sourcePublicKey: body.sourcePublicKey,
          expiresAt: Date.now() + 600000,
        };
        return new Response(JSON.stringify({
          sessionId: sessionStore.sessionId,
          code: sessionStore.code,
          expiresAt: sessionStore.expiresAt,
          createdAt: Date.now(),
        }), { status: 200 });
      }

      if (urlStr.includes('/api/transfer/claim') && method === 'POST') {
        if (!sessionStore || sessionStore.code !== body.code) {
          return new Response(JSON.stringify({ error: 'SESSION_NOT_FOUND' }), { status: 404 });
        }
        sessionStore.status = 'CLAIMED';
        sessionStore.destinationPublicKey = body.destinationPublicKey;
        return new Response(JSON.stringify({
          sessionId: sessionStore.sessionId,
          sourcePublicKey: sessionStore.sourcePublicKey,
          expiresAt: sessionStore.expiresAt,
        }), { status: 200 });
      }

      if (urlStr.includes('/api/transfer/status') && method === 'GET') {
        if (!sessionStore) {
          return new Response(JSON.stringify({ error: 'SESSION_NOT_FOUND' }), { status: 404 });
        }
        return new Response(JSON.stringify({
          status: sessionStore.status,
          destinationPublicKey: sessionStore.destinationPublicKey,
          hasPayload: !!sessionStore.encryptedPayload,
          manifestPreview: sessionStore.manifestPreview,
          expiresAt: sessionStore.expiresAt,
        }), { status: 200 });
      }

      if (urlStr.includes('/api/transfer/payload') && method === 'POST') {
        sessionStore.encryptedPayload = body.ciphertext;
        sessionStore.iv = body.iv;
        sessionStore.manifestPreview = body.manifestPreview;
        sessionStore.status = 'READY';
        return new Response(JSON.stringify({ success: true, status: 'READY' }), { status: 200 });
      }

      if (urlStr.includes('/api/transfer/payload') && method === 'GET') {
        return new Response(JSON.stringify({
          iv: sessionStore.iv,
          ciphertext: sessionStore.encryptedPayload,
          manifestPreview: sessionStore.manifestPreview,
        }), { status: 200 });
      }

      if (urlStr.includes('/api/transfer/complete') && method === 'POST') {
        sessionStore.status = 'COMPLETED';
        if (notificationFails) throw new Error('Relay unavailable after import');
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      if (urlStr.includes('/api/transfer/cancel') && method === 'POST') {
        sessionStore.status = 'CANCELLED';
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      return new Response('Not found', { status: 404 });
    });

    // 1. Laptop A starts session
    const statusEvents: string[] = [];
    let senderSas: string | undefined;
    const sender = await transferService.startSenderSession((st, details) => {
      statusEvents.push(st);
      if (st === 'VERIFYING') senderSas = details;
    });

    expect(sender.code).toBe('8F4K-92QX');

    // 2. Laptop B claims session
    const receiver = await transferService.claimAndConnect('8F4K-92QX');
    expect(receiver.sessionId).toBe(sender.sessionId);

    // Wait for Laptop A poller to detect claim and upload payload
    await vi.waitFor(() => expect(statusEvents).toContain('VERIFYING'), { timeout: 10_000 });
    expect(senderSas).toMatch(/^\d{6}$/);
    expect(senderSas).toBe(receiver.sas);
    expect(sessionStore.encryptedPayload).toBeUndefined();
    sender.confirmSas();
    await vi.waitFor(() => expect(statusEvents).toContain('READY'), { timeout: 10_000 });

    // 3. Laptop B fetches payload and previews stats
    const { stats, executeImport } = await receiver.fetchPayloadAndPreview();
    expect(stats).toBeDefined();
    expect(stats.projectsCount).toBeGreaterThanOrEqual(1);

    // 4. Laptop B executes atomic import
    const logsBefore = await transferService.listTransferLogs();
    const countBefore = logsBefore.length;
    await expect(executeImport()).rejects.toThrow('Confirm the matching verification code');
    expect(await transferService.listTransferLogs()).toHaveLength(countBefore);
    receiver.confirmSas();
    const importedStats = await executeImport();
    const logsAfter = await transferService.listTransferLogs();
    expect(logsAfter).toHaveLength(countBefore + 1);
    expect(logsAfter[0]).toMatchObject({ sessionId: 'session-mock', direction: 'incoming' });
    expect(JSON.parse(logsAfter[0].statsJson)).toEqual(importedStats);
    expect(Number.isNaN(Date.parse(logsAfter[0].createdAt))).toBe(false);
    expect(importedStats.projectsCount).toBe(stats.projectsCount);

    // Wait for completion status to propagate
    await vi.waitFor(() => {
      expect(statusEvents).toContain('READY');
      expect(statusEvents).toContain('COMPLETED');
    }, { timeout: 10_000 });
  }, 30_000);

  it('does not download when cancelled during an in-flight status request', async () => {
    const key = await transferCrypto.generateEphemeralKeypair();
    vi.spyOn(transferClient, 'claimSession').mockResolvedValue({
      sessionId: 'cancel-test', expiresAt: Date.now() + 60_000,
      sourcePublicKey: await transferCrypto.exportPublicKey(key.publicKey),
    });
    let releaseStatus!: (value: Awaited<ReturnType<typeof transferClient.getStatus>>) => void;
    vi.spyOn(transferClient, 'getStatus').mockImplementation(() => new Promise(resolve => {
      releaseStatus = resolve;
    }));
    vi.spyOn(transferClient, 'cancelTransfer').mockResolvedValue(undefined);
    const download = vi.spyOn(transferClient, 'downloadPayload');
    const receiver = await transferService.claimAndConnect('CANCEL-ME');
    const pending = receiver.fetchPayloadAndPreview();
    const rejected = expect(pending).rejects.toThrow('cancelled');
    await receiver.cancel();
    releaseStatus({ status: 'READY', hasPayload: true, expiresAt: receiver.expiresAt });
    await rejected;
    expect(download).not.toHaveBeenCalled();
  });

});
