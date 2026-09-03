import {
  LIVE_PREVIEW_READY,
  parseLivePreviewEnvelope,
  type LivePreviewEnvelope
} from '@titane/core';

/**
 * True when the demo was opened as a live preview (`?live=1`).
 */
export const wantsLivePreview = (query: { live?: string | string[] }): boolean => {
  const value = query.live;
  return value === '1' || (Array.isArray(value) && value[0] === '1');
};

/**
 * Tells the editor this tab can receive a world, then waits for the first envelope.
 * @param editorOrigin - Accepted `postMessage` origin.
 * @param timeoutMs - Fall back to the committed scene after this delay.
 */
export const waitForLivePreview = (
  editorOrigin: string,
  timeoutMs = 4000
): Promise<LivePreviewEnvelope | null> =>
  new Promise(resolve => {
    let settled = false;

    const finish = (envelope: LivePreviewEnvelope | null): void => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      resolve(envelope);
    };

    const onMessage = (event: MessageEvent): void => {
      if (event.origin !== editorOrigin) return;
      const envelope = parseLivePreviewEnvelope(event.data);
      if (envelope) finish(envelope);
    };

    window.addEventListener('message', onMessage);

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: LIVE_PREVIEW_READY }, editorOrigin);
    }

    window.setTimeout(() => finish(null), timeoutMs);
  });

/**
 * Listens for later envelopes so the demo hot-reloads without a page refresh.
 */
export const subscribeLivePreview = (
  editorOrigin: string,
  onEnvelope: (envelope: LivePreviewEnvelope) => void
): (() => void) => {
  const onMessage = (event: MessageEvent): void => {
    if (event.origin !== editorOrigin) return;
    const envelope = parseLivePreviewEnvelope(event.data);
    if (envelope) onEnvelope(envelope);
  };

  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
};
