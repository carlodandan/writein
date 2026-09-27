import type {
  RelayClaimResponse,
  RelayCreateResponse,
  RelayPayloadResponse,
  RelayStatusResponse,
  TransferStats,
} from '../types/transfer';

export const DEFAULT_RELAY_URL = 'https://transfer.writein.app';

export class TransferApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'TransferApiError';
  }
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, '')}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON
  }

  if (!res.ok) {
    const errorCode = json?.error || `HTTP_${res.status}`;
    const errorMessage = json?.message || text || 'Transfer relay request failed';
    throw new TransferApiError(errorCode, errorMessage, res.status);
  }

  return json as T;
}

export const transferClient = {
  /**
   * Initializes a temporary transfer session and receives a pairing code.
   */
  async createSession(
    sourcePublicKey: string,
    relayUrl = DEFAULT_RELAY_URL
  ): Promise<RelayCreateResponse> {
    return requestJson<RelayCreateResponse>(relayUrl, '/api/transfer/create', {
      method: 'POST',
      body: JSON.stringify({ sourcePublicKey }),
    });
  },

  /**
   * Claims a transfer session using the human-readable pairing code.
   */
  async claimSession(
    code: string,
    destinationPublicKey: string,
    relayUrl = DEFAULT_RELAY_URL
  ): Promise<RelayClaimResponse> {
    return requestJson<RelayClaimResponse>(relayUrl, '/api/transfer/claim', {
      method: 'POST',
      body: JSON.stringify({ code, destinationPublicKey }),
    });
  },

  /**
   * Checks the status and destination public key of an active transfer session.
   */
  async getStatus(
    sessionId: string,
    relayUrl = DEFAULT_RELAY_URL
  ): Promise<RelayStatusResponse> {
    return requestJson<RelayStatusResponse>(
      relayUrl,
      `/api/transfer/status?sessionId=${encodeURIComponent(sessionId)}`,
      { method: 'GET' }
    );
  },

  /**
   * Uploads the encrypted payload and manifest preview to the relay.
   */
  async uploadPayload(
    sessionId: string,
    iv: string,
    ciphertext: string,
    manifestPreview?: TransferStats,
    relayUrl = DEFAULT_RELAY_URL
  ): Promise<void> {
    await requestJson(relayUrl, '/api/transfer/payload', {
      method: 'POST',
      body: JSON.stringify({ sessionId, iv, ciphertext, manifestPreview }),
    });
  },

  /**
   * Downloads the encrypted payload from the relay.
   */
  async downloadPayload(
    sessionId: string,
    relayUrl = DEFAULT_RELAY_URL
  ): Promise<RelayPayloadResponse> {
    return requestJson<RelayPayloadResponse>(
      relayUrl,
      `/api/transfer/payload?sessionId=${encodeURIComponent(sessionId)}`,
      { method: 'GET' }
    );
  },

  /**
   * Confirms transfer completion and instructs the relay to purge the payload.
   */
  async completeTransfer(
    sessionId: string,
    relayUrl = DEFAULT_RELAY_URL
  ): Promise<void> {
    await requestJson(relayUrl, '/api/transfer/complete', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  /**
   * Cancels the transfer session and instructs the relay to purge all session data.
   */
  async cancelTransfer(
    sessionId: string,
    relayUrl = DEFAULT_RELAY_URL
  ): Promise<void> {
    await requestJson(relayUrl, '/api/transfer/cancel', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },
};
