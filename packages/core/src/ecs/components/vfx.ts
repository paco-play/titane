import { defineComponent } from '../kernel/registry';
import { field } from '../schema/fields';

/** Playback: continuous spawn, or one shot of `rate` particles. */
export const VFX_MODES = ['loop', 'burst'] as const;

/**
 * CPU particle emitter. Playback lives in the renderer pool — particles
 * are never ECS entities.
 */
export const Vfx = defineComponent('vfx', {
    schema: {
        mode: field.enum(VFX_MODES),
        lifetime: field.number({ min: 0.05, max: 10, step: 0.05, default: 1 }),
        /** Loop: particles per second. Burst: count spawned once. */
        rate: field.number({ min: 0, max: 200, step: 1, default: 16 }),
        color: field.color({ default: '#ffffff' }),
        size: field.number({ min: 0.01, max: 2, step: 0.01, default: 0.2 }),
        texture: field.asset({ accept: 'texture' })
    }
});

/** Inferred authoring data for {@link Vfx}. */
export type VfxData = ReturnType<typeof Vfx.create>;
