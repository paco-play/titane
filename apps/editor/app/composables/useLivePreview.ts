import { serializeWorld, createLivePreviewEnvelope, isLivePreviewReady } from '@titane/core';
import { useTitane } from './useTitane';

/** Demo tab opened by {@link openPreview}. Shared across every caller. */
const preview = shallowRef<Window | null>(null);
let listening = false;

/**
 * Pushes the current editor world into a demo tab opened as a live preview.
 * Safe to call from more than one composable: the window and the handshake
 * listener are module singletons.
 */
export const useLivePreview = () => {
  const { engine } = useTitane();
  const config = useRuntimeConfig();
  const demoUrl = String(config.public.demoUrl);
  const demoOrigin = new URL(demoUrl).origin;

  const publish = (): void => {
    if (!engine.value) return;
    const target = preview.value;
    if (!target || target.closed) return;

    const envelope = createLivePreviewEnvelope(serializeWorld(engine.value.world));
    target.postMessage(envelope, demoOrigin);
  };

  if (import.meta.client && !listening) {
    listening = true;
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.origin !== demoOrigin) return;
      if (!isLivePreviewReady(event.data)) return;
      if (event.source !== preview.value) return;
      publish();
    });
  }

  /**
   * Opens (or focuses) the demo with `?live=1` and sends the current world
   * as soon as the demo announces it is ready.
   */
  const openPreview = (): void => {
    const url = `${demoUrl.replace(/\/$/, '')}/?live=1`;
    const existing = preview.value;
    if (existing && !existing.closed) {
      existing.focus();
      publish();
      return;
    }
    preview.value = window.open(url, 'titane-demo-preview');
  };

  return { openPreview, publish };
};
