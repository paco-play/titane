import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import { updateComponent } from '../ecs/kernel/component';
import { Input } from '../ecs/components/input';

/**
 * Stateless driver that bridges DOM events to the ECS Input component.
 * Must be disposed to prevent memory leaks from event listeners.
 */
export class InputDriver {
    private world: World;
    private inputEntityId: Entity;
    private canvas: HTMLCanvasElement | null = null; // Use canvas for mouse coords if available

    // Strict method binding for removeEventListener compatibility
    private onKeyDownBound = this.onKeyDown.bind(this);
    private onKeyUpBound = this.onKeyUp.bind(this);
    private onMouseMoveBound = this.onMouseMove.bind(this);
    private onMouseDownBound = this.onMouseDown.bind(this);
    private onMouseUpBound = this.onMouseUp.bind(this);
    private onContextMenuBound = this.onContextMenu.bind(this); // Stop right click menu

    constructor(world: World, inputEntityId: Entity, canvas?: HTMLCanvasElement) {
        this.world = world;
        this.inputEntityId = inputEntityId;
        this.canvas = canvas ?? null;

        // Register global events
        window.addEventListener('keydown', this.onKeyDownBound);
        window.addEventListener('keyup', this.onKeyUpBound);
        
        // Mouse should ideally be localized to Canvas if available
        const mouseTarget = this.canvas ? this.canvas : window;
        mouseTarget.addEventListener('mousemove', this.onMouseMoveBound as EventListener);
        mouseTarget.addEventListener('mousedown', this.onMouseDownBound as EventListener);
        mouseTarget.addEventListener('mouseup', this.onMouseUpBound as EventListener);
        mouseTarget.addEventListener('contextmenu', this.onContextMenuBound as EventListener);
    }

    public dispose(): void {
        window.removeEventListener('keydown', this.onKeyDownBound);
        window.removeEventListener('keyup', this.onKeyUpBound);

        const mouseTarget = this.canvas ? this.canvas : window;
        mouseTarget.removeEventListener('mousemove', this.onMouseMoveBound as EventListener);
        mouseTarget.removeEventListener('mousedown', this.onMouseDownBound as EventListener);
        mouseTarget.removeEventListener('mouseup', this.onMouseUpBound as EventListener);
        mouseTarget.removeEventListener('contextmenu', this.onContextMenuBound as EventListener);
    }

    private onKeyDown(event: KeyboardEvent): void {
        // We use pure functions to securely poke data.
        updateComponent(this.world, this.inputEntityId, Input, (input) => {
            if (!input.keys[event.code]) {
                input.justPressed[event.code] = true;
            }
            input.keys[event.code] = true;
        });
    }

    private onKeyUp(event: KeyboardEvent): void {
        updateComponent(this.world, this.inputEntityId, Input, (input) => {
            input.keys[event.code] = false;
        });
    }

    private onMouseMove(event: MouseEvent): void {
        updateComponent(this.world, this.inputEntityId, Input, (input) => {
            // Coordinate normalization: -1 to +1 using canvas bounds if available, window otherwise.
            let width = window.innerWidth;
            let height = window.innerHeight;
            let x = event.clientX;
            let y = event.clientY;

            if (this.canvas) {
                const rect = this.canvas.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
                x = event.clientX - rect.left;
                y = event.clientY - rect.top;
            }

            input.mouse.x = (x / width) * 2 - 1;
            input.mouse.y = -(y / height) * 2 + 1; // Negative for standard 3D cartesian y-up
        });
    }

    private onMouseDown(event: MouseEvent): void {
        updateComponent(this.world, this.inputEntityId, Input, (input) => {
            if (event.button >= 0 && event.button <= 2) {
                input.mouse.buttons[event.button] = true;
            }
        });
    }

    private onMouseUp(event: MouseEvent): void {
        updateComponent(this.world, this.inputEntityId, Input, (input) => {
            if (event.button >= 0 && event.button <= 2) {
                input.mouse.buttons[event.button] = false;
            }
        });
    }

    private onContextMenu(event: MouseEvent): void {
        // Intercept right click so we can use right-click smoothly for gaming
        event.preventDefault();
    }
}
