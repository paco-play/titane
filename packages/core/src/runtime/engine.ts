import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import type { IRenderer } from './renderer-interface';
import type { Scheduler } from '../ecs/pipeline/scheduler';
import type { System } from '../ecs/pipeline/system';
import { createWorld } from '../ecs/kernel/world';
import { Clock } from '../utils/clock';
import { createScheduler, registerSystem, runScheduler } from '../ecs/pipeline/scheduler';
import { Phase } from '../ecs/pipeline/system';
import { createEntity } from '../ecs/kernel/entity';
import { addComponent } from '../ecs/kernel/component';
import { Input, createDefaultInput } from '../ecs/components/input';
import { Name, createName } from '../ecs/components/name';
import { InputDriver } from './input-driver';
import { setupDefaultPipeline } from '../ecs/pipeline/setup';
import { captureWorldState, restoreWorldState } from '../ecs/kernel/state-manager';

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

    private snapshot: World | null = null;
    private readonly clock: Clock;
    private readonly inputDriver: InputDriver;
    private isRunning: boolean = false;

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
        this.seedGlobalInput();

        // 3. Mount the Input Driver logic matching standard Editor Window APIs
        this.inputDriver = new InputDriver(this.world, this.globalInputEntity, canvasElement);

        // 4. Build the deterministic engine pipeline
        this.scheduler = createScheduler();
        setupDefaultPipeline(this.scheduler, this.renderer, () => this.isPaused);
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
     * Starts the engine execution loop.
     */
    public start(): void {
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

        // Input state is live runtime data, never authored content. Whatever a
        // scene file carried is dropped so the engine keeps exactly one input
        // singleton, the one the InputDriver writes to.
        this.world._stores[Input.index]?.clear();
        this.seedGlobalInput();
    }

    /**
     * (Re)installs the Input and Name components on the global input entity,
     * and re-reserves its ID against the freshly loaded entity counters.
     *
     * A loaded scene brings its own `nextId` and free list, which may both
     * consider this ID available. Handing it out again would let a game object
     * overwrite the input singleton: it would render in the viewport while
     * disappearing from any UI that filters engine-owned entities out.
     */
    private seedGlobalInput(): void {
        const { entities } = this.world;

        entities.active.add(this.globalInputEntity);

        if (entities.nextId <= this.globalInputEntity) {
            entities.nextId = this.globalInputEntity + 1;
        }

        const freeSlot = entities.recycled.indexOf(this.globalInputEntity);
        if (freeSlot !== -1) entities.recycled.splice(freeSlot, 1);

        addComponent(this.world, this.globalInputEntity, Input, createDefaultInput());
        addComponent(this.world, this.globalInputEntity, Name, createName('System (Global Input)'));
    }

    /**
     * Runs exactly one frame of the pipeline, regardless of the loop state.
     * @returns The delta time used for this frame, in seconds.
     */
    public tick(): number {
        const deltaTime = this.clock.getDelta();
        runScheduler(this.scheduler, this.world, deltaTime);
        return deltaTime;
    }

    /**
     * The main execution loop.
     * Delegates all system execution to the functional Scheduler.
     */
    private loop(): void {
        if (!this.isRunning) return;

        this.tick();
        requestAnimationFrame(() => this.loop());
    }
}
