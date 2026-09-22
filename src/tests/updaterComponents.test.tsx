import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  install: vi.fn(),
  useUpdater: vi.fn(),
}));

vi.mock('../hooks/useUpdater', () => ({ useUpdater: mocks.useUpdater }));
vi.mock('../utils/appVersion', () => ({ useAppVersion: () => 'v1.0.0' }));

import { UpdateCheck } from '../components/updater/UpdateCheck';
import { UpdateNotificationDialog } from '../components/updater/UpdateNotificationDialog';

describe('updater controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useUpdater.mockReturnValue({
      state: {
        stage: 'available',
        version: '1.1.0',
        notes: 'Release notes',
        percent: null,
        error: null,
      },
      check: mocks.check,
      install: mocks.install,
    });
  });

  it('does not mount useUpdater while the notification dialog is closed', () => {
    const props = {
      version: '1.1.0',
      onClose: vi.fn(),
    };
    const view = render(<UpdateNotificationDialog {...props} isOpen={false} />);

    expect(mocks.useUpdater).not.toHaveBeenCalled();

    view.rerender(<UpdateNotificationDialog {...props} isOpen />);
    expect(mocks.useUpdater).toHaveBeenCalledOnce();
  });

  it('disables manual checks while installation confirmation is open', () => {
    render(<UpdateCheck />);

    fireEvent.click(screen.getByRole('button', { name: /install & restart/i }));

    const checkButton = screen.getByRole('button', { name: /check for updates/i });
    expect((checkButton as HTMLButtonElement).disabled).toBe(true);
  });
});
