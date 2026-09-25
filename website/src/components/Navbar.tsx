import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Moon, Sun, Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenDeepLinkModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDeepLinkModal }) => {
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-[var(--paper-bg)]/85 backdrop-blur-md border-b border-[var(--paper-border)] shadow-xs py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--paper-border-subtle)] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs bg-[var(--paper-surface)]">
              <img src="/writeicon.png" alt="WriteIn Icon" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-serif-novel text-xl font-bold tracking-tight text-[var(--ink-primary)]">
                  WriteIn
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-[var(--paper-desk)] border border-[var(--paper-border)] text-[var(--ink-secondary)]">
                  v4.1.0
                </span>
              </div>
              <span className="text-[11px] text-[var(--ink-muted)] -mt-1 hidden sm:block">
                Author's Desktop Studio
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[var(--ink-secondary)]">
            <a href="#features" className="hover:text-[var(--amber-accent)] transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-[var(--amber-accent)] transition-colors flex items-center space-x-1">
              <span>Interactive Desk</span>
            </a>
            <a href="#compiler" className="hover:text-[var(--amber-accent)] transition-colors">
              MS Word Compiler
            </a>
            <a href="#compare" className="hover:text-[var(--amber-accent)] transition-colors">
              Comparison
            </a>
            <a href="#manifesto" className="hover:text-[var(--amber-accent)] transition-colors">
              Local-First
            </a>
            <a href="#faq" className="hover:text-[var(--amber-accent)] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions & Deep Link */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)] transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenDeepLinkModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--paper-border)] hover:border-[var(--amber-accent)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-[var(--paper-desk-hover)] transition-all cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
              <span>Open in App</span>
            </button>

            <a
              href="#download"
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Windows</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--paper-border)] text-[var(--ink-secondary)]"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-[var(--paper-border)] text-[var(--ink-secondary)]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 p-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-lg space-y-3 text-sm">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[var(--ink-secondary)] hover:text-[var(--amber-accent)]"
            >
              Features
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[var(--ink-secondary)] hover:text-[var(--amber-accent)]"
            >
              Interactive Desk Demo
            </a>
            <a
              href="#compiler"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[var(--ink-secondary)] hover:text-[var(--amber-accent)]"
            >
              MS Word (.docx) Compiler
            </a>
            <a
              href="#compare"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[var(--ink-secondary)] hover:text-[var(--amber-accent)]"
            >
              Comparison Table
            </a>
            <a
              href="#manifesto"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[var(--ink-secondary)] hover:text-[var(--amber-accent)]"
            >
              Local-First Manifesto
            </a>
            <div className="pt-3 border-t border-[var(--paper-border)] flex flex-col space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDeepLinkModal();
                }}
                className="w-full text-center py-2.5 text-xs font-semibold rounded-lg border border-[var(--paper-border)]"
              >
                Open in WriteIn App (writein://)
              </button>
              <a
                href="#download"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold rounded-lg bg-[var(--amber-accent)] text-white"
              >
                Download for Desktop
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
