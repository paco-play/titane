import { defineComponent } from '../kernel/registry';

/**
 * Data structure for naming an entity.
 */
export interface Name {
    value: string;
}

/**
 * Factory function to create a Name component data object.
 * @param value - The name string (defaults to "GameObject").
 */
export const createName = (value = 'GameObject'): Name => ({ value });

/**
 * Typed handle for the Name component.
 */
export const Name = defineComponent<Name>('name', createName);
