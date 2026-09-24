import { isTauri } from './tauriIpc';

export interface DeepLinkHandler {
  onNewProject?: () => void;
  onOpenProject?: (projectId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

type DeepLinkListener = (url: string) => void;
const listeners = new Set<DeepLinkListener>();

export const deepLinkService = {
  /**
   * Subscribe to incoming deep link URLs
   */
  subscribe(listener: DeepLinkListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Initialize deep link listener in Tauri desktop environment
   */
  async initialize(handlers?: DeepLinkHandler): Promise<void> {
    if (!isTauri()) {
      return;
    }

    try {
      const { onOpenUrl, getCurrent } = await import('@tauri-apps/plugin-deep-link');

      const handleUrl = (rawUrl: string | string[] | null) => {
        if (!rawUrl) return;
        const urls = Array.isArray(rawUrl) ? rawUrl : [rawUrl];

        for (const urlStr of urls) {
          if (!urlStr || !urlStr.startsWith('writein:')) continue;
          console.info('[DeepLink] Received deep link:', urlStr);
          listeners.forEach((listener) => listener(urlStr));

          try {
            // Parse writein://action?param=value
            const parsed = new URL(urlStr);
            const action = parsed.hostname || parsed.pathname.replace(/^\/\//, '').split('/')[0];
            const searchParams = parsed.searchParams;

            if (action === 'new' || action === 'new-project') {
              handlers?.onNewProject?.();
            } else if (action === 'open') {
              const id = searchParams.get('id');
              if (id && handlers?.onOpenProject) {
                handlers.onOpenProject(id);
              }
            } else if (action === 'tab' || action === 'navigate') {
              const tab = searchParams.get('tab') || searchParams.get('to');
              if (tab && handlers?.onNavigateTab) {
                handlers.onNavigateTab(tab);
              }
            }
          } catch (err) {
            console.warn('[DeepLink] Error parsing deep link URL:', err);
          }
        }
      };

      // Check current launch URLs
      try {
        const currentUrls = await getCurrent();
        if (currentUrls) {
          handleUrl(currentUrls);
        }
      } catch (err) {
        console.debug('[DeepLink] getCurrent not available or returned error:', err);
      }

      // Listen for runtime deep link activations
      await onOpenUrl((urls) => {
        handleUrl(urls);
      });
    } catch (err) {
      console.warn('[DeepLink] Failed to initialize Tauri deep link plugin:', err);
    }
  },
};
