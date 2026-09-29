import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceTransferView } from '../components/settings/DeviceTransferView';
import { transferService } from '../services/transferService';

vi.mock('../context/ProjectContext', () => ({ useProject: () => ({ refreshProjects: vi.fn() }) }));
vi.mock('../services/transferService', () => ({
  transferService: {
    getDeviceId: vi.fn().mockResolvedValue('test-device'),
    listTransferLogs: vi.fn().mockResolvedValue([]),
    startSenderSession: vi.fn(),
    claimAndConnect: vi.fn(),
  },
}));

const stats = {
  projectsCount: 1, documentsCount: 0, chaptersCount: 0, charactersCount: 0,
  locationsCount: 0, timelineCount: 0, notesCount: 0, worldbuildingCount: 0, attachmentsCount: 0,
};

describe('DeviceTransferView', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it.each(['COMPLETED', 'CANCELLED', 'ERROR'])('preserves %s after countdown expiry', async (status) => {
    vi.useFakeTimers();
    let notify!: (status: string, details?: unknown) => void;
    vi.mocked(transferService.startSenderSession).mockImplementation(async (callback) => {
      notify = callback;
      return { sessionId: 's', code: 'PAIR-CODE', expiresAt: Date.now() + 1000,
        cancel: vi.fn(), confirmSas: vi.fn() };
    });
    render(<DeviceTransferView />);
    await act(async () => { fireEvent.click(screen.getByText('Generate Pairing Code')); });
    act(() => notify(status, status === 'ERROR' ? 'Transfer failed' : undefined));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.queryByText('Session expired.')).toBeNull();
    expect(screen.getByText('Expires in: Expired')).toBeTruthy();
  });

  it('shows the SAS and allows cancellation while waiting without applying a late preview', async () => {
    let resolvePreview!: (value: { stats: typeof stats; executeImport: () => Promise<typeof stats> }) => void;
    const cancel = vi.fn().mockResolvedValue(undefined);
    const confirmSas = vi.fn();
    vi.mocked(transferService.claimAndConnect).mockResolvedValue({
      sessionId: 's', expiresAt: Date.now() + 60_000, sas: '123456', cancel, confirmSas,
      fetchPayloadAndPreview: () => new Promise(resolve => { resolvePreview = resolve; }),
    });
    render(<DeviceTransferView />);
    fireEvent.click(screen.getByText('Receive (Importer)'));
    fireEvent.change(screen.getByPlaceholderText('XXXX-XXXX'), { target: { value: 'PAIR-CODE' } });
    await act(async () => { fireEvent.click(screen.getByText('Connect to Device')); });
    expect(screen.getByText('123456')).toBeTruthy();
    expect(confirmSas).not.toHaveBeenCalled();
    const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
    expect(cancelButton.disabled).toBe(false);
    await act(async () => { fireEvent.click(cancelButton); });
    expect(cancel).toHaveBeenCalledOnce();
    await act(async () => { resolvePreview({ stats, executeImport: vi.fn() }); });
    expect(screen.queryByText('Import Into WriteIn')).toBeNull();
    expect(screen.queryByText('123456')).toBeNull();
  });

  it('requires an explicit matching-code confirmation before enabling import', async () => {
    const confirmSas = vi.fn();
    const executeImport = vi.fn().mockResolvedValue(stats);
    vi.mocked(transferService.claimAndConnect).mockResolvedValue({
      sessionId: 's', expiresAt: Date.now() + 60_000, sas: '123456', cancel: vi.fn(), confirmSas,
      fetchPayloadAndPreview: vi.fn().mockResolvedValue({ stats, executeImport }),
    });
    render(<DeviceTransferView />);
    fireEvent.click(screen.getByText('Receive (Importer)'));
    fireEvent.change(screen.getByPlaceholderText('XXXX-XXXX'), { target: { value: 'PAIR-CODE' } });
    await act(async () => { fireEvent.click(screen.getByText('Connect to Device')); });
    const importButton = screen.getByText('Import Into WriteIn').closest('button')!;
    expect(importButton.disabled).toBe(true);
    fireEvent.click(screen.getByText('Codes match — allow import'));
    expect(confirmSas).toHaveBeenCalledOnce();
    expect(importButton.disabled).toBe(false);
    await act(async () => { fireEvent.click(importButton); });
    expect(executeImport).toHaveBeenCalledOnce();
  });
});
