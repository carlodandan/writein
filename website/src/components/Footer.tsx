import React from 'react';
import { Shield, Cloud, ExternalLink, GitBranch } from 'lucide-react';

interface FooterProps {
  onOpenDeepLinkModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDeepLinkModal }) => {
  return (
    <footer className="bg-[var(--paper-desk)] border-t border-[var(--paper-border)] pt-16 pb-12 text-xs text-[var(--ink-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--paper-border-subtle)] flex items-center justify-center shadow-2xs bg-[var(--paper-surface)]">
                <img src="/writeicon.png" alt="WriteIn Icon" className="w-full h-full object-cover" />
              </div>
              <span className="font-serif-novel text-xl font-bold tracking-tight text-[var(--ink-primary)]">
                WriteIn
              </span>
            </div>
            <p className="text-xs text-[var(--ink-muted)] max-w-sm leading-relaxed">
              The private, offline-first desktop studio for long-form fiction writers and novelists. Built with Tauri, Rust, and SQLite.
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-[var(--ink-muted)]">
              <span>Version 2.0.0</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Zero Telemetry</span>
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-serif-novel font-bold text-sm text-[var(--ink-primary)]">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-[var(--ink-secondary)]">
              <li>
                <a href="#features" className="hover:text-[var(--amber-accent)] transition-colors">
                  Manuscript Workspace
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-[var(--amber-accent)] transition-colors">
                  Interactive Desk Simulator
                </a>
              </li>
              <li>
                <a href="#compiler" className="hover:text-[var(--amber-accent)] transition-colors">
                  Word (.docx) Compiler
                </a>
              </li>
              <li>
                <a href="#compare" className="hover:text-[var(--amber-accent)] transition-colors">
                  Software Comparison
                </a>
              </li>
              <li>
                <a href="#download" className="hover:text-[var(--amber-accent)] transition-colors">
                  Desktop Downloads
                </a>
              </li>
            </ul>
          </div>

          {/* Integration & Deep Links */}
          <div className="space-y-3">
            <h4 className="font-serif-novel font-bold text-sm text-[var(--ink-primary)]">
              Desktop Integration
            </h4>
            <ul className="space-y-2 text-xs text-[var(--ink-secondary)]">
              <li>
                <button
                  onClick={onOpenDeepLinkModal}
                  className="hover:text-[var(--amber-accent)] transition-colors text-left flex items-center space-x-1 cursor-pointer"
                >
                  <span>Protocol: writein://</span>
                  <ExternalLink className="w-3 h-3 text-[var(--amber-accent)]" />
                </button>
              </li>
              <li>
                <a href="writein://new" className="hover:text-[var(--amber-accent)] transition-colors">
                  Trigger New Project
                </a>
              </li>
              <li>
                <a href="writein://open" className="hover:text-[var(--amber-accent)] transition-colors">
                  Launch Desktop App
                </a>
              </li>
              <li>
                <a href="#manifesto" className="hover:text-[var(--amber-accent)] transition-colors">
                  Local-First Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Cloudflare Pages & Source */}
          <div className="space-y-3">
            <h4 className="font-serif-novel font-bold text-sm text-[var(--ink-primary)]">
              Deployment & Source
            </h4>
            <ul className="space-y-2 text-xs text-[var(--ink-secondary)]">
              <li>
                <a
                  href="https://github.com/carlodandan/writein"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--amber-accent)] transition-colors flex items-center space-x-1.5"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li className="flex items-center space-x-1 text-emerald-600 font-medium">
                <Cloud className="w-3.5 h-3.5 text-orange-500" />
                <span>Cloudflare Pages Edge</span>
              </li>
              <li>
                <a
                  href="https://github.com/carlodandan/writein/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--amber-accent)] transition-colors"
                >
                  Release Notes
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--paper-border-subtle)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--ink-muted)] gap-4">
          <p>© {new Date().getFullYear()} WriteIn. Free and open software for authors.</p>
          <div className="flex items-center space-x-4">
            <span>Built with Tauri v2, Rust & React</span>
            <span>•</span>
            <span>Deployable on Cloudflare Pages</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
