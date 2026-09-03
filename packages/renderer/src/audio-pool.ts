import type { Entity, World } from '@titane/core';
import { defineQuery, runQuery, getComponent, Sound, Transform } from '@titane/core';
import type { SoundData } from '@titane/core';

const soundQuery = defineQuery([Sound]);

/**
 * One playable voice. Injected so tests never touch Web Audio.
 */
export interface AudioVoice {
    setVolume(volume: number): void;
    setLoop(loop: boolean): void;
    setPosition(x: number, y: number, z: number): void;
    play(): void;
    pause(): void;
    dispose(): void;
}

export type SoundBufferFactory = (url: string) => Promise<unknown>;
export type AudioVoiceFactory = (buffer: unknown, positional: boolean) => AudioVoice;

/** Shared decoded buffer plus the number of live voices. */
interface PooledBuffer {
    refs: number;
    ready: Promise<unknown>;
}

/** Per-entity runtime state. */
interface SoundEntry {
    url: string;
    positional: boolean;
    voice: AudioVoice | null;
    token: number;
    started: boolean;
}

/**
 * Plays ECS `Sound` components.
 *
 * One decoded buffer is shared per URL. A token cancels stale loads when
 * the URL or `positional` flag changes, or when the entity is destroyed.
 * `play()` is called only on the rising edge of `playing` so a one-shot
 * clip is not restarted every frame after it ends.
 */
export class AudioPool {
    private readonly loadBuffer: SoundBufferFactory;
    private readonly createVoice: AudioVoiceFactory;
    private readonly buffers = new Map<string, PooledBuffer>();
    private readonly tracked = new Map<Entity, SoundEntry>();
    private readonly liveSet = new Set<Entity>();
    private readonly inflight = new Set<Promise<void>>();
    private token = 0;

    constructor(loadBuffer: SoundBufferFactory, createVoice: AudioVoiceFactory) {
        this.loadBuffer = loadBuffer;
        this.createVoice = createVoice;
    }

    /** Resolves when every in-flight decode started so far has settled. */
    public get ready(): Promise<void> {
        return Promise.all(this.inflight).then(() => undefined);
    }

    /** Number of live voices. Exposed for tests. */
    public get voiceCount(): number {
        let count = 0;
        for (const entry of this.tracked.values()) {
            if (entry.voice) count += 1;
        }
        return count;
    }

    /** Number of distinct URLs currently retained. Exposed for tests. */
    public get bufferCount(): number {
        return this.buffers.size;
    }

    /**
     * Creates, reloads and updates every live sound for one render frame.
     */
    public sync(world: World): void {
        const liveEntities = runQuery(world, soundQuery);
        this.liveSet.clear();
        for (const entity of liveEntities) this.liveSet.add(entity);

        for (const [entity, entry] of this.tracked) {
            if (!this.liveSet.has(entity)) this.drop(entity, entry);
        }

        for (const entity of liveEntities) {
            const data = getComponent(world, entity, Sound);
            if (!data) continue;

            let entry = this.tracked.get(entity);
            if (!entry) {
                entry = { url: '', positional: data.positional, voice: null, token: 0, started: false };
                this.tracked.set(entity, entry);
            }

            const url = data.url;
            if (entry.url !== url || entry.positional !== data.positional) {
                this.detach(entry);
                entry.url = url;
                entry.positional = data.positional;
                if (url !== '') this.beginLoad(entry, url, data.positional);
            }

            this.apply(entry, data, world, entity);
        }
    }

    public dispose(): void {
        for (const [entity, entry] of this.tracked) this.drop(entity, entry);
        this.buffers.clear();
        this.inflight.clear();
    }

    private beginLoad(entry: SoundEntry, url: string, positional: boolean): void {
        const token = ++this.token;
        entry.token = token;

        const work = this.retain(url)
            .then(buffer => {
                if (entry.token !== token) {
                    this.release(url);
                    return;
                }
                entry.voice = this.createVoice(buffer, positional);
            })
            .catch(() => {
                this.release(url);
            });

        this.inflight.add(work);
        void work.finally(() => this.inflight.delete(work));
    }

    private retain(url: string): Promise<unknown> {
        const cached = this.buffers.get(url);
        if (cached) {
            cached.refs += 1;
            return cached.ready;
        }

        const ready = this.loadBuffer(url);
        this.buffers.set(url, { refs: 1, ready });
        ready.catch(() => {
            this.buffers.delete(url);
        });
        return ready;
    }

    private release(url: string): void {
        const pooled = this.buffers.get(url);
        if (!pooled) return;

        pooled.refs -= 1;
        if (pooled.refs > 0) return;
        this.buffers.delete(url);
    }

    private apply(
        entry: SoundEntry,
        data: SoundData,
        world: World,
        entity: Entity
    ): void {
        const voice = entry.voice;
        if (!voice) return;

        voice.setVolume(data.volume);
        voice.setLoop(data.loop);

        if (data.positional) {
            const transform = getComponent(world, entity, Transform);
            if (transform) {
                const m = transform.worldMatrix;
                voice.setPosition(m[12], m[13], m[14]);
            }
        }

        if (data.playing && !entry.started) {
            voice.play();
            entry.started = true;
        } else if (!data.playing && entry.started) {
            voice.pause();
            entry.started = false;
        }
    }

    private detach(entry: SoundEntry): void {
        entry.token += 1;
        entry.voice?.dispose();
        entry.voice = null;
        entry.started = false;
        if (entry.url !== '') this.release(entry.url);
    }

    private drop(entity: Entity, entry: SoundEntry): void {
        this.detach(entry);
        this.tracked.delete(entity);
    }
};
