import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { RELEASES } from '../components/changelog/changelogData';
import { ChangelogModal } from '../components/changelog/ChangelogModal';
import { useChangelogWatcher } from '../components/changelog/useChangelogWatcher';

describe('Changelog Data', () => {
  it('contains valid release notes sorted chronologically with v4.3.0 as latest', () => {
    expect(RELEASES.length).toBeGreaterThan(0);
    expect(RELEASES[0].version).toBe('v4.3.0');
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
    expect(screen.getByText("In-App What's New Changelog & Brand Identity Polish")).toBeDefined();

    // Tab switching
    const historyTab = screen.getByText(/All Releases/);
    fireEvent.click(historyTab);
    expect(screen.getByText(/End-to-End Encrypted Device-to-Device Transfer/)).toBeDefined();

    // Close button
    const closeBtn = screen.getByText("Got it, Let's Write");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('writein_last_seen_changelog_version')).toBe('v4.3.0');
  });

  it('persists dont-show preference when checked', () => {
    const handleClose = vi.fn();
    render(<ChangelogModal isOpen={true} onClose={handleClose} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const closeBtn = screen.getByText("Got it, Let's Write");
    fireEvent.click(closeBtn);

    expect(localStorage.getItem('writein_dont_show_changelog_on_startup')).toBe('v4.3.0');
  });

  it('names the modal, moves focus inside, and traps Tab in both directions', () => {
    render(<ChangelogModal isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: "What's New in WriteIn" });
    const first = screen.getByRole('button', { name: 'Close dialog' });
    const last = screen.getByRole('button', { name: "Got it, Let's Write" });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    dialog.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    fireEvent.click(checkbox);
    expect(document.activeElement).toBe(checkbox);
    // Interior Tab presses keep their native behavior.
    expect(fireEvent.keyDown(checkbox, { key: 'Tab' })).toBe(true);
  });

  it.each(['Escape', 'Close dialog', "Got it, Let's Write"])(
    'restores focus to the trigger after closing with %s',
    (closeAction) => {
      function ChangelogLauncher() {
        const [isOpen, setIsOpen] = useState(false);
        return <>
          <button onClick={() => setIsOpen(true)}>View What's New</button>
          <ChangelogModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>;
      }

      render(<StrictMode><ChangelogLauncher /></StrictMode>);
      const trigger = screen.getByRole('button', { name: "View What's New" });
      trigger.focus();
      fireEvent.click(trigger);
      expect(document.activeElement).toBe(screen.getByRole('dialog'));

      if (closeAction === 'Escape') {
        fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      } else {
        fireEvent.click(screen.getByRole('button', { name: closeAction }));
      }

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    }
  );
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

  it('runs the startup check once after StrictMode effect replay', async () => {
    const onOpen = vi.fn();
    render(<StrictMode><TestWatcherComponent onOpen={onOpen} /></StrictMode>);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('reschedules a canceled startup timer with the latest callback', async () => {
    const originalOnOpen = vi.fn();
    const latestOnOpen = vi.fn();
    const { rerender } = render(<TestWatcherComponent onOpen={originalOnOpen} />);
    act(() => { vi.advanceTimersByTime(50); });
    rerender(<TestWatcherComponent onOpen={latestOnOpen} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(originalOnOpen).not.toHaveBeenCalled();
    expect(latestOnOpen).toHaveBeenCalledTimes(1);
    rerender(<TestWatcherComponent onOpen={originalOnOpen} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(originalOnOpen).not.toHaveBeenCalled();
    expect(latestOnOpen).toHaveBeenCalledTimes(1);
  });

  it('suppresses onOpen if user chose not to show on startup', async () => {
    localStorage.setItem('writein_dont_show_changelog_on_startup', 'v4.3.0');
    const onOpen = vi.fn();
    render(<TestWatcherComponent onOpen={onOpen} />);

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('suppresses onOpen if user has already seen this version', async () => {
    localStorage.setItem('writein_last_seen_changelog_version', 'v4.3.0');
    const onOpen = vi.fn();
    render(<TestWatcherComponent onOpen={onOpen} />);

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(onOpen).not.toHaveBeenCalled();
  });
});