import type { World } from '../kernel/world';
import type { Entity } from '../types';
import { defineQuery, runQuery } from '../kernel/query';
import { getComponent } from '../kernel/component';
import { Transform } from '../components/transform';
import { mat4FromTRS, mat4Multiply } from '../../utils/math';

/** Pre-allocated matrix for local computations, to prevent GC pauses. */
const TEMP_LOCAL_MATRIX = new Float32Array(16);

const transformQuery = defineQuery([Transform]);

/** Reused BFS buffers: parallel arrays avoid allocating a node object per entity. */
const queueIds: Entity[] = [];
const queueParentDirty: boolean[] = [];

/**
 * Reused parent -> children index. Sibling arrays are emptied rather than
 * dropped between frames, so the buffers are only ever grown once.
 */
const childrenMap = new Map<Entity, Entity[]>();

/**
 * Calculates world matrices for all transforms iteratively.
 * Uses Breadth-First Search (BFS) to compute parents before children reliably.
 * In-place math and recycled buffers ensure zero allocations during the loop.
 * @param world - The current world state.
 */
export const transformSystem = (world: World): void => {
    const allTransforms = runQuery(world, transformQuery);
    if (allTransforms.length === 0) return;

    // 1. Reset buffers, then index children by parent and seed roots
    queueIds.length = 0;
    queueParentDirty.length = 0;
    childrenMap.forEach(siblings => { siblings.length = 0; });

    for (const entityId of allTransforms) {
        const transform = getComponent(world, entityId, Transform);
        if (!transform) continue;

        // An entity pointing at a parent without a Transform is orphaned:
        // treat it as a root so its matrix is still computed.
        const parent = transform.parent;
        if (parent === null || !getComponent(world, parent, Transform)) {
            queueIds.push(entityId);
            queueParentDirty.push(false);
            continue;
        }

        let siblings = childrenMap.get(parent);
        if (!siblings) {
            siblings = [];
            childrenMap.set(parent, siblings);
        }
        siblings.push(entityId);
    }

    // 2. Iterative BFS. A moving head index avoids the cost of shift().
    let head = 0;
    while (head < queueIds.length) {
        const entityId = queueIds[head];
        const parentDirty = queueParentDirty[head];
        head++;

        const transform = getComponent(world, entityId, Transform);
        if (!transform) continue;

        const isDirty = transform.isDirty || parentDirty;

        if (isDirty) {
            mat4FromTRS(
                TEMP_LOCAL_MATRIX,
                transform.position,
                transform.rotation,
                transform.scale
            );

            const parentTransform = transform.parent === null
                ? undefined
                : getComponent(world, transform.parent, Transform);

            if (parentTransform) {
                // M_world = M_parent * M_local
                mat4Multiply(transform.worldMatrix, parentTransform.worldMatrix, TEMP_LOCAL_MATRIX);
            } else {
                // Root (or orphaned) entity: the world matrix IS the local matrix
                transform.worldMatrix.set(TEMP_LOCAL_MATRIX);
            }

            transform.isDirty = false;
        }

        // Enqueue children, propagating the dirty state down the branch
        const children = childrenMap.get(entityId);
        if (children) {
            for (const childId of children) {
                queueIds.push(childId);
                queueParentDirty.push(isDirty);
            }
        }
    }
};
