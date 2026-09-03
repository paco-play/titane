/**
 * Mutable handle backing a packed `{ x, y, z }` view.
 * Stores update `packed` in place when the buffer grows.
 */
export interface PackedVec3Handle {
    packed: Float32Array;
    index: number;
    stride: number;
    offset: number;
    dead: boolean;
}

/**
 * Builds a plain `{ x, y, z }` view so deep equality still matches authored vec3s.
 */
export const createPackedVec3 = (handle: PackedVec3Handle): { x: number; y: number; z: number } => ({
    get x(): number {
        return handle.dead ? 0 : handle.packed[handle.index * handle.stride + handle.offset];
    },
    set x(value: number) {
        if (!handle.dead) handle.packed[handle.index * handle.stride + handle.offset] = value;
    },
    get y(): number {
        return handle.dead ? 0 : handle.packed[handle.index * handle.stride + handle.offset + 1];
    },
    set y(value: number) {
        if (!handle.dead) handle.packed[handle.index * handle.stride + handle.offset + 1] = value;
    },
    get z(): number {
        return handle.dead ? 0 : handle.packed[handle.index * handle.stride + handle.offset + 2];
    },
    set z(value: number) {
        if (!handle.dead) handle.packed[handle.index * handle.stride + handle.offset + 2] = value;
    }
});
