import type { World } from './world';
import type { Entity } from '../types';
import { defineQuery, runQuery } from './query';
import { getComponent, updateComponent } from './component';
import { Camera } from '../components/camera';

const cameraQuery = defineQuery([Camera]);

/**
 * The entity flagged `current`, or `null` when none is.
 */
export const pickCurrentCamera = (world: World): Entity | null => {
    for (const entityId of runQuery(world, cameraQuery)) {
        if (getComponent(world, entityId, Camera)?.current) return entityId;
    }
    return null;
};

/**
 * Makes `entityId` the current camera and clears the flag on every other one.
 * Pass `null` to clear all.
 */
export const setCurrentCamera = (world: World, entityId: Entity | null): void => {
    for (const id of runQuery(world, cameraQuery)) {
        updateComponent(world, id, Camera, (data) => {
            data.current = id === entityId;
        });
    }
};
