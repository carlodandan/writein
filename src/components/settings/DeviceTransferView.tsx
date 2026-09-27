import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRightLeft,
  ShieldCheck,
  Lock,
  Upload,
  Download,
  Copy,
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  HardDrive,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { transferService } from '../../services/transferService';
import type { TransferLogItem, TransferStats } from '../../types/transfer';
import { useProject } from '../../context/ProjectContext';

interface DeviceTransferViewProps {
  onOpenBackupModal?: () => void;
}

export const DeviceTransferView: React.FC<DeviceTransferViewProps> = ({
  onOpenBackupModal,
}) => {
  const { refreshProjects } = useProject();
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'logs'>('send');
  const [deviceId, setDeviceId] = useState<string>('');

  // Sender state
  const [isStartingSender, setIsStartingSender] = useState(false);
  const [senderSession, setSenderSession] = useState<{
    sessionId: string;
    code: string;
    expiresAt: number;
    cancel: () => Promise<void>;
  } | null>(null);
  const [senderStatus, setSenderStatus] = useState<string>('IDLE');
  const [senderStats, setSenderStats] = useState<TransferStats | null>(null);
  const [senderError, setSenderError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [senderTimeLeft, setSenderTimeLeft] = useState<string>('');

  // Receiver state
  const [receiveCode, setReceiveCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [receiverSession, setReceiverSession] = useState<any | null>(null);
  const [previewStats, setPreviewStats] = useState<TransferStats | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccess, setImportSuccess] = useState(false);
  const [receiverError, setReceiverError] = useState<string | null>(null);
  const executeImportRef = useRef<(() => Promise<TransferStats>) | null>(null);

  // Transfer history logs
  const [logs, setLogs] = useState<TransferLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    transferService.getDeviceId().then(setDeviceId).catch(() => {});
  }, []);

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const list = await transferService.listTransferLogs();
      setLogs(list);
    } catch (e) {
      console.warn('Failed to load transfer logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  // Sender Countdown Timer
  useEffect(() => {
    if (!senderSession) return;
    const interval = setInterval(() => {
      const diff = senderSession.expiresAt - Date.now();
      if (diff <= 0) {
        setSenderTimeLeft('Expired');
        setSenderStatus('EXPIRED');
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setSenderTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [senderSession]);

  const handleStartSender = async () => {
    setIsStartingSender(true);
    setSenderError(null);
    setSenderStatus('INITIALIZING');
    try {
      const session = await transferService.startSenderSession((status, details) => {
        setSenderStatus(status);
        if (status === 'READY' && details) {
          setSenderStats(details);
        }
        if (status === 'ERROR') {
          setSenderError(details || 'Transfer failed');
        }
        if (status === 'COMPLETED') {
          loadLogs();
        }
      });
      setSenderSession(session);
      setSenderStatus('CREATED');
    } catch (err: any) {
      setSenderError(err?.message || 'Failed to initialize transfer session');
      setSenderStatus('ERROR');
    } finally {
      setIsStartingSender(false);
    }
  };

  const handleCancelSender = async () => {
    if (senderSession) {
      await senderSession.cancel();
      setSenderSession(null);
      setSenderStatus('IDLE');
      setSenderStats(null);
    }
  };

  const handleCopyCode = () => {
    if (!senderSession) return;
    navigator.clipboard.writeText(senderSession.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConnectReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveCode.trim()) return;

    setIsConnecting(true);
    setReceiverError(null);
    setPreviewStats(null);
    setImportSuccess(false);

    try {
      const session = await transferService.claimAndConnect(receiveCode.trim());
      setReceiverSession(session);

      // Await payload from sender
      const { stats, executeImport } = await session.fetchPayloadAndPreview();
      setPreviewStats(stats);
      executeImportRef.current = executeImport;
    } catch (err: any) {
      setReceiverError(err?.message || 'Failed to connect to transfer session');
      setReceiverSession(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!executeImportRef.current) return;
    setIsImporting(true);
    setImportProgress(25);
    setReceiverError(null);

    try {
      setImportProgress(60);
      await executeImportRef.current();
      setImportProgress(100);
      setImportSuccess(true);
      await refreshProjects();
      loadLogs();
    } catch (err: any) {
      setReceiverError(err?.message || 'Failed to import library package');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetReceiver = async () => {
    if (receiverSession) {
      await receiverSession.cancel().catch(() => {});
    }
    setReceiverSession(null);
    setReceiveCode('');
    setPreviewStats(null);
    setImportSuccess(false);
    setReceiverError(null);
    executeImportRef.current = null;
  };

  return (
    <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-4 h-4 text-[var(--amber-accent)]" />
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
              Device-to-Device Transfer
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] text-[var(--amber-accent)] font-semibold">
              End-to-End Encrypted
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)]">
            Transfer your WriteIn library directly from one computer to another using an ephemeral 10-minute session.
          </p>
        </div>

        {deviceId && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border)] text-[11px] font-mono text-[var(--ink-muted)]">
            <Laptop className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]" title={deviceId}>
              ID: {deviceId.slice(0, 8)}...
            </span>
          </div>
        )}
      </div>

      {/* Security Banner */}
      <div className="p-3 rounded-lg bg-[var(--paper-desk)]/60 border border-[var(--paper-border-subtle)] flex items-start space-x-3 text-xs text-[var(--ink-secondary)]">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Zero-Knowledge Relay: Writing data is client-side encrypted via hardware-accelerated{' '}
          <strong className="text-[var(--ink-primary)]">ECDH + AES-256-GCM</strong>. Plaintext never touches the cloud and sessions are deleted upon completion or after 10 minutes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[var(--paper-border)] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'send'
              ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] font-semibold'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Transfer (Sender)</span>
        </button>
        <button
          onClick={() => setActiveTab('receive')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'receive'
              ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] font-semibold'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Receive (Importer)</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'logs'
              ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] font-semibold'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Transfer History</span>
        </button>
      </div>

      {/* Tab 1: Sender */}
      {activeTab === 'send' && (
        <div className="space-y-4">
          {!senderSession ? (
            <div className="text-center py-8 border border-dashed border-[var(--paper-border)] rounded-xl bg-[var(--paper-desk)]/30 space-y-3">
              <Upload className="w-8 h-8 text-[var(--amber-accent)] mx-auto opacity-70" />
              <div className="max-w-md mx-auto space-y-1">
                <p className="text-xs font-semibold text-[var(--ink-primary)]">
                  Transfer WriteIn Library to Another Computer
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  Generates a single-use 8-character pairing code. Enter this code on your other computer to securely copy your projects, chapters, documents, and attachments.
                </p>
              </div>
              <button
                onClick={handleStartSender}
                disabled={isStartingSender}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-[var(--amber-accent)] hover:opacity-90 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                {isStartingSender ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                )}
                <span>{isStartingSender ? 'Creating Session...' : 'Generate Pairing Code'}</span>
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-desk)]/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                    Temporary Pairing Code
                  </span>
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="font-mono text-2xl font-bold tracking-wider px-4 py-1.5 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[var(--ink-primary)] shadow-sm">
                      {senderSession.code}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
                      title="Copy Pairing Code"
                    >
                      {copiedCode ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-medium text-[var(--amber-accent)]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires in: {senderTimeLeft || '10:00'}</span>
                  </div>
                  <span className="text-[10px] text-[var(--ink-muted)] block">Single-use session</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="p-3 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {senderStatus === 'CREATED' && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[var(--ink-secondary)]">
                        Waiting for receiving device to connect...
                      </span>
                    </>
                  )}
                  {senderStatus === 'ENCRYPTING' && (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-[var(--amber-accent)] animate-spin" />
                      <span className="text-[var(--ink-secondary)]">
                        Device paired! Packaging & encrypting library with AES-256-GCM...
                      </span>
                    </>
                  )}
                  {senderStatus === 'UPLOADING' && (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-[var(--amber-accent)] animate-spin" />
                      <span className="text-[var(--ink-secondary)]">
                        Uploading encrypted payload to relay...
                      </span>
                    </>
                  )}
                  {senderStatus === 'READY' && (
                    <>
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-medium">
                        Encrypted payload delivered. Waiting for receiver to finalize import...
                      </span>
                    </>
                  )}
                  {senderStatus === 'COMPLETED' && (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-semibold">
                        Transfer complete! Payload purged from relay.
                      </span>
                    </>
                  )}
                  {senderStatus === 'CANCELLED' && (
                    <>
                      <X className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-500 font-medium">Session cancelled.</span>
                    </>
                  )}
                  {senderStatus === 'EXPIRED' && (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-500 font-medium">Session expired.</span>
                    </>
                  )}
                </div>

                <button
                  onClick={handleCancelSender}
                  className="px-3 py-1 rounded text-xs font-medium text-[var(--ink-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  {senderStatus === 'COMPLETED' ? 'Close' : 'Cancel'}
                </button>
              </div>

              {senderStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block">Projects</span>
                    <strong className="text-sm">{senderStats.projectsCount}</strong>
                  </div>
                  <div className="p-2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block">Chapters</span>
                    <strong className="text-sm">{senderStats.chaptersCount}</strong>
                  </div>
                  <div className="p-2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block">Characters</span>
                    <strong className="text-sm">{senderStats.charactersCount}</strong>
                  </div>
                  <div className="p-2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block">Attachments</span>
                    <strong className="text-sm">{senderStats.attachmentsCount}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {senderError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{senderError}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Receiver */}
      {activeTab === 'receive' && (
        <div className="space-y-4">
          {!previewStats ? (
            <form
              onSubmit={handleConnectReceiver}
              className="p-5 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-desk)]/30 space-y-4"
            >
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[var(--ink-primary)]">
                  Enter Pairing Code
                </label>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Type the 8-character code displayed on your sending device (e.g. 8F4K-92QX)
                </p>
              </div>

              <div className="flex space-x-3">
                <input
                  type="text"
                  value={receiveCode}
                  onChange={(e) => setReceiveCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  disabled={isConnecting}
                  className="font-mono uppercase text-base tracking-wider px-4 py-2 rounded-lg bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--amber-accent)] w-full max-w-[240px]"
                />
                <button
                  type="submit"
                  disabled={isConnecting || !receiveCode.trim()}
                  className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-[var(--amber-accent)] hover:opacity-90 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isConnecting ? 'Connecting & Decrypting...' : 'Connect to Device'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-5 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-serif-novel text-sm font-semibold text-[var(--ink-primary)]">
                    Library Package Decrypted & Verified
                  </h4>
                </div>
                <button
                  onClick={handleResetReceiver}
                  disabled={isImporting}
                  className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border)]">
                  <span className="text-[10px] text-[var(--ink-muted)] block">Novels / Projects</span>
                  <strong className="text-base text-[var(--ink-primary)]">
                    {previewStats.projectsCount}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border)]">
                  <span className="text-[10px] text-[var(--ink-muted)] block">Manuscript Chapters</span>
                  <strong className="text-base text-[var(--ink-primary)]">
                    {previewStats.chaptersCount}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border)]">
                  <span className="text-[10px] text-[var(--ink-muted)] block">Character Cast</span>
                  <strong className="text-base text-[var(--ink-primary)]">
                    {previewStats.charactersCount}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border)]">
                  <span className="text-[10px] text-[var(--ink-muted)] block">Attachments</span>
                  <strong className="text-base text-[var(--ink-primary)]">
                    {previewStats.attachmentsCount}
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                Conflict Protection: Existing local novel projects will never be overwritten. Any incoming novels with matching names will be restored safely alongside your current database.
              </p>

              {isImporting && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-[var(--ink-secondary)]">
                    <span>Unpacking SQLite data & writing attachments...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-[var(--paper-desk)] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[var(--amber-accent)] h-2 transition-all duration-300 rounded-full"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {importSuccess ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Library successfully imported into WriteIn!</span>
                  </div>
                  <button
                    onClick={handleResetReceiver}
                    className="px-3 py-1 rounded bg-emerald-600 text-white font-medium text-[11px]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleExecuteImport}
                    disabled={isImporting}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[var(--amber-accent)] hover:opacity-90 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                  >
                    {isImporting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isImporting ? 'Importing Library...' : 'Import Into WriteIn'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {receiverError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{receiverError}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          {isLoadingLogs ? (
            <div className="text-center py-8 text-xs text-[var(--ink-muted)]">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 opacity-60" />
              <span>Loading transfer history...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[var(--paper-border)] rounded-xl bg-[var(--paper-desk)]/20 text-xs text-[var(--ink-muted)]">
              No previous device transfer logs found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {logs.map((log) => {
                let stats: any = {};
                try {
                  stats = JSON.parse(log.statsJson);
                } catch {}

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      {log.direction === 'outgoing' ? (
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-[var(--amber-accent)]">
                          <Upload className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                          <Download className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[var(--ink-primary)] capitalize">
                          {log.direction} Transfer
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          {new Date(log.createdAt).toLocaleString()} &bull;{' '}
                          {stats.projectsCount ?? stats.projects_count ?? 0} projects,{' '}
                          {stats.chaptersCount ?? stats.chapters_count ?? 0} chapters
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                      {log.sessionId.slice(0, 8)}...
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Local Backups Link */}
      {onOpenBackupModal && (
        <div className="pt-2 border-t border-[var(--paper-border)] flex items-center justify-between text-xs">
          <span className="text-[var(--ink-muted)]">
            Prefer offline file archives? Create or restore `.writein` bundles locally.
          </span>
          <button
            onClick={onOpenBackupModal}
            className="flex items-center space-x-1.5 text-[var(--amber-accent)] hover:underline font-medium"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Open Local Backups</span>
          </button>
        </div>
      )}
    </div>
  );
};
