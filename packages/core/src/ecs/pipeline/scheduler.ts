import type { World } from '../kernel/world';
import type { System } from './system';
import { PHASE_ORDER, Phase } from './system';

/**
 * Data structure representing the system execution pipeline.
 */
export type Scheduler = {
    readonly systems: Record<Phase, System[]>;
};

/**
 * Creates a fresh Scheduler with empty phases.
 * @returns A new Scheduler instance.
 */
export const createScheduler = (): Scheduler => ({
    systems: {
        [Phase.INPUT]: [],
        [Phase.UPDATE]: [],
        [Phase.PHYSICS]: [],
        [Phase.POST_PHYSICS]: [],
        [Phase.RENDER]: []
    }
});

/**
 * Registers a system into a specific execution phase.
 * Systems run in registration order within a phase.
 * @param scheduler The scheduler state.
 * @param phase The target execution phase.
 * @param system The system function to register.
 */
export const registerSystem = (
    scheduler: Scheduler,
    phase: Phase,
    system: System
): void => {
    scheduler.systems[phase].push(system);
};

/**
 * Removes a previously registered system from a phase.
 * @param scheduler The scheduler state.
 * @param phase The phase the system was registered into.
 * @param system The exact system reference to remove.
 * @returns True if the system was found and removed.
 */
export const unregisterSystem = (
    scheduler: Scheduler,
    phase: Phase,
    system: System
): boolean => {
    const phaseSystems = scheduler.systems[phase];
    const index = phaseSystems.indexOf(system);
    if (index === -1) return false;

    phaseSystems.splice(index, 1);
    return true;
};

/**
 * Executes all registered systems in the strict deterministic order of phases.
 * @param scheduler The scheduler state.
 * @param world The current world state.
 * @param deltaTime Time elapsed since the last frame.
 */
export const runScheduler = (
    scheduler: Scheduler,
    world: World,
    deltaTime: number
): void => {
    for (const phase of PHASE_ORDER) {
        for (const system of scheduler.systems[phase]) {
            system(world, deltaTime);
        }
    }
};
