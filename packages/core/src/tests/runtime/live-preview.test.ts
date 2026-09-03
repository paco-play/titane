import { describe, it, expect } from 'vitest';
import {
    LIVE_PREVIEW_TYPE,
    LIVE_PREVIEW_READY,
    createLivePreviewEnvelope,
    parseLivePreviewEnvelope,
    isLivePreviewReady,
    SCENE_FORMAT_VERSION,
    type SerializedWorld
} from '../../index';

const sampleWorld = (): SerializedWorld => ({
    version: SCENE_FORMAT_VERSION,
    nextId: 1,
    entities: [0],
    components: {}
});

describe('live preview envelope', () => {
    it('round-trips a serialized world', () => {
        const envelope = createLivePreviewEnvelope(sampleWorld(), 42);
        expect(envelope.type).toBe(LIVE_PREVIEW_TYPE);
        expect(envelope.revision).toBe(42);
        expect(parseLivePreviewEnvelope(envelope)?.world.entities).toEqual([0]);
    });

    it('rejects unrelated postMessage data', () => {
        expect(parseLivePreviewEnvelope(null)).toBeNull();
        expect(parseLivePreviewEnvelope({ type: 'other' })).toBeNull();
        expect(parseLivePreviewEnvelope({ type: LIVE_PREVIEW_TYPE, revision: 1 })).toBeNull();
    });

    it('recognizes the ready handshake', () => {
        expect(isLivePreviewReady({ type: LIVE_PREVIEW_READY })).toBe(true);
        expect(isLivePreviewReady({ type: LIVE_PREVIEW_TYPE })).toBe(false);
    });
});
