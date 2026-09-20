import { invokeCommand } from './tauriIpc';

export const settingsService = {
  async getSetting(key: string): Promise<string | null> {
    return invokeCommand<string | null>('get_setting', { key });
  },

  async saveSetting(
    key: string,
    value: string
  ): Promise<{ key: string; value: string; updated_at: string }> {
    return invokeCommand<{ key: string; value: string; updated_at: string }>(
      'save_setting',
      { key, value }
    );
  },

  async getAllSettings(): Promise<Record<string, string>> {
    return invokeCommand<Record<string, string>>('get_all_settings');
  },

  async deleteSetting(key: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_setting', { key });
  },
};
