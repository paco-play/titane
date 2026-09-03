import { describe, it, expect, beforeEach } from 'vitest';
import {
    createWorld,
    createEntity,
    addComponent,
    updateComponent,
    destroyEntity,
    createSound,
    createTransform,
    Sound,
    Transform
} from '@titane/core';
import { AudioPool, type AudioVoice } from '../audio-pool';

interface VoiceLog {
    plays: number;
    pauses: number;
    disposed: boolean;
    volume: number;
    loop: boolean;
    position: { x: number; y: number; z: number } | null;
}

const makeVoice = (): { voice: AudioVoice; log: VoiceLog } => {
    const log: VoiceLog = {
        plays: 0,
        pauses: 0,
        disposed: false,
        volume: 1,
        loop: false,
        position: null
    };

    const voice: AudioVoice = {
        setVolume: volume => { log.volume = volume; },
        setLoop: loop => { log.loop = loop; },
        setPosition: (x, y, z) => { log.position = { x, y, z }; },
        play: () => { log.plays += 1; },
        pause: () => { log.pauses += 1; },
        dispose: () => { log.disposed = true; }
    };

    return { voice, log };
};

describe('AudioPool', () => {
    let logs: VoiceLog[];
    let pool: AudioPool;

    beforeEach(() => {
        logs = [];
        pool = new AudioPool(
            async () => ({}),
            () => {
                const made = makeVoice();
                logs.push(made.log);
                return made.voice;
            }
        );
    });

    it('creates a voice when a URL is set', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Sound, createSound('clip.ogg'));

        pool.sync(world);
        await pool.ready;

        expect(pool.voiceCount).toBe(1);
        expect(pool.bufferCount).toBe(1);
    });

    it('shares one decoded buffer across entities with the same URL', async () => {
        const world = createWorld();
        const a = createEntity(world);
        const b = createEntity(world);
        addComponent(world, a, Transform, createTransform());
        addComponent(world, b, Transform, createTransform());
        addComponent(world, a, Sound, createSound('shared.ogg'));
        addComponent(world, b, Sound, createSound('shared.ogg'));

        pool.sync(world);
        await pool.ready;

        expect(pool.voiceCount).toBe(2);
        expect(pool.bufferCount).toBe(1);
    });

    it('plays only on the rising edge of playing', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Sound, createSound('edge.ogg', 1, false, true, true));

        pool.sync(world);
        await pool.ready;
        pool.sync(world);
        pool.sync(world);

        expect(logs[0]?.plays).toBe(1);
    });

    it('pauses when playing is cleared and plays again when it returns', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Sound, createSound('toggle.ogg', 1, false, true, true));

        pool.sync(world);
        await pool.ready;
        pool.sync(world);

        updateComponent(world, entity, Sound, data => { data.playing = false; });
        pool.sync(world);
        updateComponent(world, entity, Sound, data => { data.playing = true; });
        pool.sync(world);

        expect(logs[0]?.pauses).toBe(1);
        expect(logs[0]?.plays).toBe(2);
    });

    it('writes volume, loop and world position onto the voice', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        const transform = createTransform({ x: 3, y: 1, z: 2 });
        transform.worldMatrix[12] = 3;
        transform.worldMatrix[13] = 1;
        transform.worldMatrix[14] = 2;
        addComponent(world, entity, Transform, transform);
        addComponent(world, entity, Sound, createSound('posed.ogg', 0.4, true, true, false));

        pool.sync(world);
        await pool.ready;
        pool.sync(world);

        expect(logs[0]?.volume).toBe(0.4);
        expect(logs[0]?.loop).toBe(true);
        expect(logs[0]?.position).toEqual({ x: 3, y: 1, z: 2 });
    });

    it('does not pose a non-positional voice', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        const transform = createTransform({ x: 9, y: 0, z: 0 });
        transform.worldMatrix[12] = 9;
        addComponent(world, entity, Transform, transform);
        addComponent(world, entity, Sound, createSound('amb.ogg', 1, false, false, false));

        pool.sync(world);
        await pool.ready;
        pool.sync(world);

        expect(logs[0]?.position).toBeNull();
    });

    it('disposes the voice when the entity is destroyed', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Sound, createSound('gone.ogg'));

        pool.sync(world);
        await pool.ready;
        destroyEntity(world, entity);
        pool.sync(world);

        expect(logs[0]?.disposed).toBe(true);
        expect(pool.voiceCount).toBe(0);
        expect(pool.bufferCount).toBe(0);
    });

    it('stays silent while the URL is empty', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Sound, createSound());

        pool.sync(world);

        expect(pool.voiceCount).toBe(0);
        expect(pool.bufferCount).toBe(0);
    });
});
