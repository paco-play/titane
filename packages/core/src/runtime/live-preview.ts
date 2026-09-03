import type { SerializedWorld } from '../ecs/serialization';

/** `postMessage` type for a world pushed from the editor to the demo. */
export const LIVE_PREVIEW_TYPE = 'titane-live-preview' as const;

/** `postMessage` type the demo sends when it is ready to receive a world. */
export const LIVE_PREVIEW_READY = 'titane-live-preview-ready' as const;

/**
 * A serialized world plus a monotonic revision so the demo can ignore stale frames.
 */
export interface LivePreviewEnvelope {
    type: typeof LIVE_PREVIEW_TYPE;
    revision: number;
    world: SerializedWorld;
}

/**
 * Builds an envelope the demo can `loadWorld`.
 * @param world - Already-serialized scene data.
 * @param revision - Defaults to `Date.now()`.
 */
export const createLivePreviewEnvelope = (
    world: SerializedWorld,
    revision = Date.now()
): LivePreviewEnvelope => ({
    type: LIVE_PREVIEW_TYPE,
    revision,
    world
});

/**
 * Narrows unknown `postMessage` data to a live-preview envelope.
 */
export const parseLivePreviewEnvelope = (data: unknown): LivePreviewEnvelope | null => {
    if (typeof data !== 'object' || data === null) return null;
    const record = data as Partial<LivePreviewEnvelope>;
    if (record.type !== LIVE_PREVIEW_TYPE) return null;
    if (typeof record.revision !== 'number') return null;
    if (typeof record.world !== 'object' || record.world === null) return null;
    if (typeof record.world.version !== 'number') return null;
    if (!Array.isArray(record.world.entities)) return null;
    return record as LivePreviewEnvelope;
};

/**
 * True when the demo is announcing it can receive a world.
 */
export const isLivePreviewReady = (data: unknown): boolean => {
    if (typeof data !== 'object' || data === null) return false;
    return (data as { type?: unknown }).type === LIVE_PREVIEW_READY;
};
