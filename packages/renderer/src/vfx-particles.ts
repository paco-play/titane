/** Hard cap so a high rate cannot allocate without bound. */
export const VFX_PARTICLE_CAP = 256;

/**
 * SoA particle buffer. One buffer per emitter — never one ECS entity
 * per particle.
 */
export interface ParticleBuffer {
    readonly capacity: number;
    count: number;
    readonly x: Float32Array;
    readonly y: Float32Array;
    readonly z: Float32Array;
    readonly vx: Float32Array;
    readonly vy: Float32Array;
    readonly vz: Float32Array;
    readonly age: Float32Array;
    readonly life: Float32Array;
    readonly size: Float32Array;
    readonly r: Float32Array;
    readonly g: Float32Array;
    readonly b: Float32Array;
}

/** Parses `#rrggbb` into 0–1 RGB. Invalid input is white. */
export const rgbFromHex = (hex: string): readonly [number, number, number] => {
    const raw = hex.startsWith('#') ? hex.slice(1) : hex;
    if (raw.length !== 6) return [1, 1, 1];
    const n = Number.parseInt(raw, 16);
    if (!Number.isFinite(n)) return [1, 1, 1];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Allocates a zeroed particle buffer. */
export const createParticleBuffer = (capacity = VFX_PARTICLE_CAP): ParticleBuffer => ({
    capacity,
    count: 0,
    x: new Float32Array(capacity),
    y: new Float32Array(capacity),
    z: new Float32Array(capacity),
    vx: new Float32Array(capacity),
    vy: new Float32Array(capacity),
    vz: new Float32Array(capacity),
    age: new Float32Array(capacity),
    life: new Float32Array(capacity),
    size: new Float32Array(capacity),
    r: new Float32Array(capacity),
    g: new Float32Array(capacity),
    b: new Float32Array(capacity)
});

/**
 * Spawns one particle at the emitter origin. Returns false when the cap is hit.
 */
export const spawnParticle = (
    buffer: ParticleBuffer,
    origin: readonly [number, number, number],
    color: readonly [number, number, number],
    size: number,
    lifetime: number
): boolean => {
    if (buffer.count >= buffer.capacity) return false;

    const i = buffer.count;
    buffer.x[i] = origin[0];
    buffer.y[i] = origin[1];
    buffer.z[i] = origin[2];
    buffer.vx[i] = Math.random() * 2 - 1;
    buffer.vy[i] = Math.random() * 1.2 + 0.2;
    buffer.vz[i] = Math.random() * 2 - 1;
    buffer.age[i] = 0;
    buffer.life[i] = Math.max(0.05, lifetime);
    buffer.size[i] = size;
    buffer.r[i] = color[0];
    buffer.g[i] = color[1];
    buffer.b[i] = color[2];
    buffer.count += 1;
    return true;
};

/** Integrates velocities and compact-removes expired particles. */
export const stepParticles = (buffer: ParticleBuffer, dt: number): void => {
    let write = 0;
    for (let i = 0; i < buffer.count; i++) {
        const life = buffer.life[i];
        const age = buffer.age[i] + dt;
        if (age >= life) continue;

        buffer.x[write] = buffer.x[i] + buffer.vx[i] * dt;
        buffer.y[write] = buffer.y[i] + buffer.vy[i] * dt;
        buffer.z[write] = buffer.z[i] + buffer.vz[i] * dt;
        buffer.vx[write] = buffer.vx[i];
        buffer.vy[write] = buffer.vy[i];
        buffer.vz[write] = buffer.vz[i];
        buffer.age[write] = age;
        buffer.life[write] = life;
        buffer.size[write] = buffer.size[i];
        buffer.r[write] = buffer.r[i];
        buffer.g[write] = buffer.g[i];
        buffer.b[write] = buffer.b[i];
        write += 1;
    }
    buffer.count = write;
};
