import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('lists transfer logs array', async () => {
    const logs = await transferService.listTransferLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it('simulates end-to-end sender and receiver flow through mock relay', async () => {
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
    const sender = await transferService.startSenderSession((st) => {
      statusEvents.push(st);
    });

    expect(sender.code).toBe('8F4K-92QX');

    // 2. Laptop B claims session
    const receiver = await transferService.claimAndConnect('8F4K-92QX');
    expect(receiver.sessionId).toBe(sender.sessionId);

    // Wait for Laptop A poller to detect claim and upload payload
    await new Promise((r) => setTimeout(r, 1600));

    // 3. Laptop B fetches payload and previews stats
    const { stats, executeImport } = await receiver.fetchPayloadAndPreview();
    expect(stats).toBeDefined();
    expect(stats.projectsCount).toBeGreaterThanOrEqual(1);

    // 4. Laptop B executes atomic import
    const importedStats = await executeImport();
    expect(importedStats.projectsCount).toBe(stats.projectsCount);

    // Wait for completion status to propagate
    await new Promise((r) => setTimeout(r, 1600));
    expect(statusEvents).toContain('READY');
    expect(statusEvents).toContain('COMPLETED');
  });
});
