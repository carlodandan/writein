import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RELEASES } from '../components/changelog/changelogData';
import { ChangelogModal } from '../components/changelog/ChangelogModal';
import { useChangelogWatcher } from '../components/changelog/useChangelogWatcher';

describe('Changelog Data', () => {
  it('contains valid release notes sorted chronologically with v4.2.1 as latest', () => {
    expect(RELEASES.length).toBeGreaterThan(0);
    expect(RELEASES[0].version).toBe('v4.2.1');
    expect(RELEASES[0].highlights.length).toBeGreaterThan(0);
    for (const release of RELEASES) {
      expect(release.version).toMatch(/^v\d+\.\d+\.\d+$/);
      expect(release.title).toBeTruthy();
      expect(release.date).toBeTruthy();
      expect(release.highlights.length).toBeGreaterThan(0);
    }
  });
});

describe('ChangelogModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ChangelogModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with latest highlights and allows tab switching', () => {
    const handleClose = vi.fn();
    render(<ChangelogModal isOpen={true} onClose={handleClose} />);

    // Header title and latest badge
    expect(screen.getByText("What's New in WriteIn")).toBeDefined();
    expect(screen.getByText('Desktop Environment Detection & Installer Polish')).toBeDefined();

    // Tab switching
    const historyTab = screen.getByText(/All Releases/);
    fireEvent.click(historyTab);
    expect(screen.getByText(/End-to-End Encrypted Device-to-Device Transfer/)).toBeDefined();

    // Close button
    const closeBtn = screen.getByText("Got it, Let's Write");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('writein_last_seen_changelog_version')).toBe('v4.2.1');
  });

  it('persists dont-show preference when checked', () => {
    const handleClose = vi.fn();
    render(<ChangelogModal isOpen={true} onClose={handleClose} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const closeBtn = screen.getByText("Got it, Let's Write");
    fireEvent.click(closeBtn);

    expect(localStorage.getItem('writein_dont_show_changelog_on_startup')).toBe('v4.2.1');
  });
});

describe('useChangelogWatcher Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function TestWatcherComponent({ onOpen }: { onOpen: () => void }) {
    useChangelogWatcher({ onOpen, delayMs: 100 });
    return null;
  }

  it('triggers onOpen when current version has not been seen', async () => {
    const onOpen = vi.fn();
    render(<TestWatcherComponent onOpen={onOpen} />);

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('suppresses onOpen if user chose not to show on startup', async () => {
    localStorage.setItem('writein_dont_show_changelog_on_startup', 'v4.2.1');
    const onOpen = vi.fn();
    render(<TestWatcherComponent onOpen={onOpen} />);

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('suppresses onOpen if user has already seen this version', async () => {
    localStorage.setItem('writein_last_seen_changelog_version', 'v4.2.1');
    const onOpen = vi.fn();
    render(<TestWatcherComponent onOpen={onOpen} />);

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(onOpen).not.toHaveBeenCalled();
  });
});
