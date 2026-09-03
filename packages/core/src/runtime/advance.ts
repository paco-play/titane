import type { World } from '../ecs/kernel/world';
import type { Scheduler } from '../ecs/pipeline/scheduler';
import { runPhases, runScheduler } from '../ecs/pipeline/scheduler';
import { Phase } from '../ecs/pipeline/system';
import { FIXED_DT, type FixedStep } from '../utils/fixed-step';

const SIMULATION_PHASES: readonly Phase[] = [Phase.UPDATE, Phase.PHYSICS];
const FRAME_HEAD: readonly Phase[] = [Phase.INPUT];
const FRAME_TAIL: readonly Phase[] = [Phase.POST_PHYSICS, Phase.RENDER];
const STEP_PHASES: readonly Phase[] = [
    Phase.UPDATE,
    Phase.PHYSICS,
    Phase.POST_PHYSICS,
    Phase.RENDER
];

/**
 * Paused editor tick: the full pipeline at frame dt, so gizmos and
 * hierarchy still resolve. Simulation systems are gated by the engine.
 */
export const tickPaused = (scheduler: Scheduler, world: World, dt: number): void => {
    runScheduler(scheduler, world, dt);
};

/**
 * Playing tick: INPUT and the render tail use frame dt; UPDATE and PHYSICS
 * run zero or more times at {@link FIXED_DT}.
 */
export const tickPlaying = (
    scheduler: Scheduler,
    world: World,
    fixedStep: FixedStep,
    dt: number
): void => {
    runPhases(scheduler, world, dt, FRAME_HEAD);

    const steps = fixedStep.consume(dt);
    for (let i = 0; i < steps; i++) {
        runPhases(scheduler, world, FIXED_DT, SIMULATION_PHASES);
    }

    runPhases(scheduler, world, dt, FRAME_TAIL);
};

/**
 * One isolated simulation step, used by the editor's Step control.
 * @returns The fixed delta that was applied.
 */
export const stepOnce = (scheduler: Scheduler, world: World): number => {
    runPhases(scheduler, world, FIXED_DT, STEP_PHASES);
    return FIXED_DT;
};
