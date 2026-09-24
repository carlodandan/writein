import React from 'react';
import { Shield, HardDrive, WifiOff, Sparkles, Database, KeyRound, Ban } from 'lucide-react';

export const PrivacyManifesto: React.FC = () => {
  return (
    <section id="manifesto" className="py-20 md:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--paper-desk)] border border-[var(--paper-border)] text-xs font-semibold text-[var(--amber-accent)] shadow-2xs">
            <Shield className="w-3.5 h-3.5" />
            <span>Our Philosophy</span>
          </div>
          <h2 className="font-serif-novel text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)]">
            Your manuscript belongs to you. Period.
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
            In an era where every writing tool is pushing subscriptions, forcing cloud synchronization, and quietly training AI models on private drafts, WriteIn takes a radical stand for author sovereignty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <WifiOff className="w-6 h-6" />
            </div>
            <h3 className="font-serif-novel text-xl font-bold text-[var(--ink-primary)]">
              100% Offline-First
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
              WriteIn requires no internet connection to launch, write, organize, or compile. Write in cabins, on long flights, in coffee shops with broken Wi-Fi, or during storms. Your studio never stalls.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="font-serif-novel text-xl font-bold text-[var(--ink-primary)]">
              Zero AI Scraping & Telemetry
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
              We collect zero keystrokes, zero telemetry, and zero document analytics. Your unpublished chapters are never uploaded to any remote server or fed into large language model training sets.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-[var(--amber-accent)] flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-serif-novel text-xl font-bold text-[var(--ink-primary)]">
              Rock-Solid SQLite Storage
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
              Each project is a single, clean SQLite database. It will open and be readable thirty years from now, long after proprietary cloud apps have been acquired, discontinued, or monetized away.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
