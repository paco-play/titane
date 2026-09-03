import type { Scheduler } from './scheduler';
import type { IRenderer } from '../../runtime/renderer-interface';
import { registerSystem } from './scheduler';
import { Phase } from './system';
import { integrateVelocitySystem } from '../systems/movement';
import { rapierPhysicsSystem } from '../systems/physics';
import { clearInputSystem } from '../systems/input-system';
import { transformSystem } from '../systems/transform';

/**
 * Registers the engine's built-in systems into their lifecycle phases.
 *
 * Only engine-level concerns live here (integration, input cleanup, transform
 * hierarchy, draw call). Gameplay systems are registered by the game through
 * `engine.addSystem`.
 *
 * @param scheduler - The scheduler to populate.
 * @param renderer - The driver performing the final draw call.
 * @param isPaused - Reads whether simulation systems should be skipped.
 */
export const setupDefaultPipeline = (
    scheduler: Scheduler,
    renderer: IRenderer,
    isPaused: () => boolean
): void => {
    registerSystem(scheduler, Phase.PHYSICS, (world, deltaTime) => {
        if (isPaused()) return;
        integrateVelocitySystem(world, deltaTime);
        rapierPhysicsSystem(world, deltaTime);
    });

    registerSystem(scheduler, Phase.POST_PHYSICS, (world) => {
        // Frame cleanup: wipe inputs that last one frame exactly
        if (!isPaused()) clearInputSystem(world);

        // Transform hierarchy must always run, even when paused, so that
        // Editor updates are correctly computed into world matrices.
        transformSystem(world);
    });

    // Rendering always runs, to keep the editor responsive while paused
    registerSystem(scheduler, Phase.RENDER, (world) => {
        renderer.render(world);
    });
};
