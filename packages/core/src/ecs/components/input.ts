import { defineComponent } from '../kernel/registry';

/**
 * Pure data representation of the global input state.
 * Strictly follows DOD constraints (no methods, purely data).
 */
export interface Input {
    /** Current state of keys held down. Mapped by `event.code` (e.g., "KeyW") */
    keys: Record<string, boolean>;
    /** Keys pressed exactly in the current frame. Mapped by `event.code` */
    justPressed: Record<string, boolean>;
    mouse: {
        /** Normalized mouse X position (-1 to 1) */
        x: number;
        /** Normalized mouse Y position (-1 to 1) */
        y: number;
        /** Mouse buttons currently held: [Left, Middle, Right] */
        buttons: [boolean, boolean, boolean];
    };
}

/**
 * Factory to create the default empty input state.
 */
export const createDefaultInput = (): Input => ({
    keys: {},
    justPressed: {},
    mouse: {
        x: 0,
        y: 0,
        buttons: [false, false, false],
    },
});

/**
 * Typed handle for the global Input component.
 */
export const Input = defineComponent<Input>('input', createDefaultInput);
