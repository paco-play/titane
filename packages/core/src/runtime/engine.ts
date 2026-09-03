import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import type { IRenderer } from './renderer-interface';
import type { Scheduler } from '../ecs/pipeline/scheduler';
import type { System } from '../ecs/pipeline/system';
import { createWorld } from '../ecs/kernel/world';
import { Clock } from '../utils/clock';
import { FixedStep } from '../utils/fixed-step';
import { createScheduler, registerSystem, unregisterSystem } from '../ecs/pipeline/scheduler';
import { Phase } from '../ecs/pipeline/system';
import { createEntity } from '../ecs/kernel/entity';
import { Input } from '../ecs/components/input';
import { InputDriver } from './input-driver';
import { setupDefaultPipeline } from '../ecs/pipeline/setup';
import { captureWorldState, restoreWorldState } from '../ecs/kernel/state-manager';
import { resetPhysicsSession, initPhysics } from '../physics/session';
import { stepOnce, tickPaused, tickPlaying } from './advance';
import { seedGlobalInput } from './global-input';

/**
 * The high-level runner for the Titane Engine.
 * Manages the execution pipeline via a functional Scheduler and delegates rendering to a driver.
 */
export class TitaneEngine {
    /** The single source of truth for the game state */
    public readonly world: World;

    /** Toggle to freeze logic systems without stopping the render loop */
    public isPaused: boolean = true;

    public readonly scheduler: Scheduler;
    public readonly renderer: IRenderer;

    /** Public access to the singleton entity ID hosting tracking inputs */
    public readonly globalInputEntity: Entity;

    /**
     * Resolves when Rapier WASM is ready. The constructor starts the load;
     * `start()` waits on this so hosts do not call `initPhysics` themselves.
     */
    public readonly ready: Promise<void>;

    private snapshot: World | null = null;
    private readonly clock: Clock;
    private readonly fixedStep = new FixedStep();
    private readonly inputDriver: InputDriver;
    private isRunning: boolean = false;
    /** True while UPDATE/PHYSICS should run (playing tick or an explicit step). */
    private simulating = false;

    /**
     * @param renderer - The renderer implementation (driver) to use.
     * @param canvasElement - The target canvas for rendering.
     */
    constructor(renderer: IRenderer, canvasElement: HTMLCanvasElement) {
        this.world = createWorld();
        this.clock = new Clock();
        this.renderer = renderer;

        // 1. Initialize the renderer driver
        this.renderer.init(canvasElement);

        // 2. Spawn the Core Global Input Entity dynamically
        this.globalInputEntity = createEntity(this.world);
        seedGlobalInput(this.world, this.globalInputEntity);

        // 3. Mount the Input Driver logic matching standard Editor Window APIs
        this.inputDriver = new InputDriver(this.world, this.globalInputEntity, canvasElement);

        // 4. Build the deterministic engine pipeline
        this.scheduler = createScheduler();
        setupDefaultPipeline(this.scheduler, this.renderer, () => !this.simulating);
        this.ready = initPhysics();
    }

    /**
     * Registers a game system into one of the engine's execution phases.
     * Systems run in registration order within a phase.
     * @param phase - The lifecycle phase to run the system in.
     * @param system - The system function to register.
     */
    public addSystem(phase: Phase, system: System): void {
        registerSystem(this.scheduler, phase, system);
    }

    /**
     * Removes a system previously registered with {@link addSystem}.
     * @param phase - The phase the system was registered into.
     * @param system - The exact function reference to remove.
     * @returns True when the system was found.
     */
    public removeSystem(phase: Phase, system: System): boolean {
        return unregisterSystem(this.scheduler, phase, system);
    }

    /**
     * Starts the engine execution loop.
     * Waits until {@link ready} so the first physics step is not a no-op.
     * Safe to call more than once; a second call while running is ignored.
     */
    public async start(): Promise<void> {
        await this.ready;
        if (this.isRunning) return;
        this.isRunning = true;
        this.clock.getDelta();
        this.loop();
    }

    /**
     * Stops the engine execution loop.
     */
    public stop(): void {
        this.isRunning = false;
    }

    /**
     * Completely strip browser hook allocations allowing for clean editor garbage cleanup
     */
    public dispose(): void {
        this.stop();
        this.inputDriver.dispose();
        resetPhysicsSession(this.world);
    }

    /**
     * Captures the current state of the world, to be reverted to later.
     */
    public saveSnapshot(): void {
        this.snapshot = captureWorldState(this.world);
    }

    /**
     * Restores the world to its previously saved state.
     *
     * The restore is done in place: the World object and its stores keep their
     * identity so the input driver, renderer and editor UI stay bound to live data.
     */
    public restoreSnapshot(): void {
        if (!this.snapshot) {
            console.warn('[Titane] No snapshot found to restore.');
            return;
        }
        restoreWorldState(this.world, this.snapshot);
        resetPhysicsSession(this.world);
    }

    /**
     * Replaces the live world content with another world's data (loaded scene).
     *
     * Like `restoreSnapshot`, the copy is done in place so every holder of the
     * World reference keeps observing live data.
     * @param source - The world whose data becomes the new scene.
     */
    public loadWorld(source: World): void {
        this.snapshot = null;
        restoreWorldState(this.world, source);
        resetPhysicsSession(this.world);

        // Input state is live runtime data, never authored content. Whatever a
        // scene file carried is dropped so the engine keeps exactly one input
        // singleton, the one the InputDriver writes to.
        this.world._stores[Input.index]?.clear();
        seedGlobalInput(this.world, this.globalInputEntity);
    }

    /**
     * Runs exactly one frame of the pipeline, regardless of the loop state.
     *
     * While paused, the full pipeline runs at frame dt so the editor stays live.
     * While playing, UPDATE and PHYSICS run on a fixed 1/60 s step.
     * Pass `deltaSeconds` to drive the frame from tests without the clock.
     *
     * @param deltaSeconds - Optional override for the frame delta, in seconds.
     * @returns The delta time used for this frame, in seconds.
     */
    public tick(deltaSeconds?: number): number {
        const measured = this.clock.getDelta();
        const deltaTime = deltaSeconds ?? measured;

        if (this.isPaused) {
            this.fixedStep.reset();
            tickPaused(this.scheduler, this.world, deltaTime);
            return deltaTime;
        }

        this.simulating = true;
        try {
            tickPlaying(this.scheduler, this.world, this.fixedStep, deltaTime);
        } finally {
            this.simulating = false;
        }

        return deltaTime;
    }

    /**
     * Advances simulation by one fixed step without unpausing.
     * UPDATE, PHYSICS, POST_PHYSICS and RENDER all run at 1/60 s.
     * @returns The fixed delta that was applied, in seconds.
     */
    public step(): number {
        this.simulating = true;
        try {
            return stepOnce(this.scheduler, this.world);
        } finally {
            this.simulating = false;
        }
    }

    /** Main loop: one tick, then schedule the next animation frame. */
    private loop(): void {
        if (!this.isRunning) return;

        this.tick();
        requestAnimationFrame(() => this.loop());
    }
}
