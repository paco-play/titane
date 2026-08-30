import type { Vec3 } from '@titane/core';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

/** Local TRS matching the `Transform` component (Euler XYZ, radians). */
export interface LocalTrs {
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
}

const parentMatrix = new Matrix4();
const localMatrix = new Matrix4();
const position = new Vector3();
const quaternion = new Quaternion();
const scale = new Vector3();
const euler = new Euler();

/**
 * Converts a world matrix into the local TRS the ECS stores.
 *
 * Rotation is recovered as Euler XYZ so it round-trips through `mat4FromTRS`.
 *
 * @param worldMatrix The object's current world matrix.
 * @param parentWorld The parent's world matrix, or null when the object is a root.
 * @returns Local position, rotation (radians) and scale.
 */
export const worldMatrixToLocalTrs = (
    worldMatrix: Matrix4,
    parentWorld: Float32Array | null
): LocalTrs => {
    if (parentWorld) {
        parentMatrix.fromArray(parentWorld);
        localMatrix.copy(parentMatrix).invert().multiply(worldMatrix);
    } else {
        localMatrix.copy(worldMatrix);
    }

    localMatrix.decompose(position, quaternion, scale);
    euler.setFromQuaternion(quaternion, 'XYZ');

    return {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: euler.x, y: euler.y, z: euler.z },
        scale: { x: scale.x, y: scale.y, z: scale.z }
    };
};
