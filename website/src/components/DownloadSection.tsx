import React from 'react';
import { Download, Monitor, ShieldCheck, CheckCircle2, ExternalLink, Package } from 'lucide-react';

export const DownloadSection: React.FC = () => {
  const windowsPackages = [
    {
      title: 'Windows Setup Installer',
      ext: '.exe',
      icon: Monitor,
      badge: 'Recommended',
      desc: 'Standard setup executable with auto-updater, desktop shortcut, and registry deep-link integration.',
      file: 'write-in_2.0.0_x64-setup.exe',
      size: '~12 MB',
      recommended: true,
      href: 'https://github.com/carlodandan/writein/releases/download/v2.0.0/write-in_2.0.0_x64-setup.exe',
    },
    {
      title: 'Windows MSI Package',
      ext: '.msi',
      icon: Package,
      badge: 'Standard Installer',
      desc: 'Native Microsoft Windows Installer package with passive installation support for clean setups.',
      file: 'write-in_2.0.0_x64_en-US.msi',
      size: '~14 MB',
      recommended: false,
      href: 'https://github.com/carlodandan/writein/releases/download/v2.0.0/write-in_2.0.0_x64_en-US.msi',
    },
  ];

  return (
    <section id="download" className="py-20 md:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--paper-desk)] border border-[var(--paper-border)] text-xs font-semibold text-[var(--amber-accent)] shadow-2xs">
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows Desktop Exclusive</span>
          </div>
          <h2 className="font-serif-novel text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)]">
            Download WriteIn for Windows
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
            Purpose-engineered for Windows 10 (x64) and Windows 11 (x64 and ARM64). 100% free, private, and local-first with zero accounts or subscriptions.
          </p>
        </div>

        {/* Windows Download Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {windowsPackages.map((pkg, i) => {
            const Icon = pkg.icon;
            return (
              <div
                key={i}
                className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 transition-all ${
                  pkg.recommended
                    ? 'border-[var(--amber-accent)] bg-[var(--paper-surface)] shadow-lg ring-1 ring-[var(--amber-accent)]/30'
                    : 'border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-xs hover:border-[var(--amber-accent)]/50'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] flex items-center justify-center text-[var(--amber-accent)]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                        pkg.recommended
                          ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] border border-[var(--amber-soft-border)]'
                          : 'bg-[var(--paper-desk)] text-[var(--ink-muted)]'
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif-novel text-xl font-bold text-[var(--ink-primary)]">
                      {pkg.title}
                    </h3>
                    <p className="text-xs font-mono text-[var(--ink-muted)] mt-0.5">
                      {pkg.file} • {pkg.size}
                    </p>
                  </div>

                  <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                    {pkg.desc}
                  </p>

                  <div className="space-y-1.5 text-xs text-[var(--ink-secondary)] pt-2 border-t border-[var(--paper-border-subtle)]">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Windows 10 / 11 (64-bit x64 & ARM64)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Registers <code className="font-mono text-[10px]">writein://</code> protocol</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Local SQLite Project Storage</span>
                    </div>
                  </div>
                </div>

                <a
                  href={pkg.href}
                  className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                    pkg.recommended
                      ? 'bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white'
                      : 'bg-[var(--paper-desk)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-primary)] border border-[var(--paper-border)]'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Download {pkg.ext}</span>
                </a>
              </div>
            );
          })}
        </div>

        {/* Security & System Requirements Note */}
        <div className="p-4 rounded-xl border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)]/50 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--ink-muted)] gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Windows Defender verified • Cryptographically signed with Minisign SHA-256</span>
          </div>

          <a
            href="https://github.com/carlodandan/writein/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-[var(--ink-secondary)] hover:text-[var(--amber-accent)] font-semibold shrink-0"
          >
            <span>View All GitHub Releases</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
};
