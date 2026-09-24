import { invoke } from '@tauri-apps/api/core';

// List of inspiring, catchy subtitles for writers
const SUBTITLES = [
  'Where your next masterpiece begins...',
  'Sharpening the ink. Unfurling the map...',
  'Crafting worlds in absolute privacy...',
  'Your stories. Your words. 100% offline.',
  'No cloud. No distractions. Just pure story.',
  'Your characters are waiting for you...',
];

// Sequential loading states
const LOADING_STEPS = [
  { progress: 15, text: 'Initializing local SQLite storage...' },
  { progress: 38, text: 'Verifying database & schema integrity...' },
  { progress: 62, text: 'Mounting manuscript hierarchy...' },
  { progress: 84, text: 'Syncing story cast & world lore...' },
  { progress: 95, text: 'Preparing distraction-free writing desk...' },
  { progress: 100, text: 'Ready to write.' },
];

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function closeSplash(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('close_splashscreen');
    } catch (err) {
      console.warn('Failed to close splashscreen via Tauri invoke:', err);
    }
  } else {
    // In standalone browser preview, redirect to index
    setTimeout(() => {
      window.location.href = '/';
    }, 600);
  }
}

async function initAppVersion(): Promise<void> {
  const versionBadge = document.getElementById('version-badge');
  if (!versionBadge) return;

  if (isTauri()) {
    try {
      const { getVersion } = await import('@tauri-apps/api/app');
      const v = await getVersion();
      if (v) {
        const formatted = v.startsWith('v') ? v : `v${v}`;
        versionBadge.innerHTML = `${formatted} &bull; Offline Novel &amp; Writing Manager`;
      }
    } catch (err) {
      console.warn('Unable to detect version via Tauri app API in splashscreen:', err);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAppVersion();
  const subtitleEl = document.getElementById('subtitle-text');
  const statusEl = document.getElementById('loading-status');
  const percentEl = document.getElementById('loading-percent');
  const progressFill = document.getElementById('progress-fill');

  // Rotate catchy subtitles with gentle fade animation
  let subtitleIndex = 0;
  if (subtitleEl) {
    subtitleEl.textContent = SUBTITLES[0];
  }

  const subtitleInterval = setInterval(() => {
    if (!subtitleEl) return;
    subtitleEl.classList.add('fade-out');
    setTimeout(() => {
      subtitleIndex = (subtitleIndex + 1) % SUBTITLES.length;
      subtitleEl.textContent = SUBTITLES[subtitleIndex];
      subtitleEl.classList.remove('fade-out');
    }, 400);
  }, 2200);

  // Animate loading states through the steps
  let stepIndex = 0;

  function executeNextStep() {
    if (stepIndex >= LOADING_STEPS.length) {
      clearInterval(subtitleInterval);
      setTimeout(closeSplash, 400);
      return;
    }

    const step = LOADING_STEPS[stepIndex];

    if (statusEl) {
      statusEl.textContent = step.text;
    }
    if (percentEl) {
      percentEl.textContent = `${step.progress}%`;
    }
    if (progressFill) {
      progressFill.style.width = `${step.progress}%`;
    }

    stepIndex++;

    // Calculate delay for next step
    const delay = step.progress === 100 ? 500 : 350 + Math.random() * 250;
    setTimeout(executeNextStep, delay);
  }

  // Start the loading sequence after initial paint
  setTimeout(executeNextStep, 250);
});
