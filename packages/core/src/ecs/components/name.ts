import { defineComponent } from '../kernel/registry';

/**
 * Data structure for naming an entity.
 * `icon` and `color` are optional editor Hierarchy cues; gameplay ignores them.
 */
export interface Name {
    value: string;
    /** Nuxt UI icon name, e.g. `i-lucide-box`. Absent = default Hierarchy glyph. */
    icon?: string;
    /** Hex tint for the Hierarchy glyph, e.g. `#4ade80`. */
    color?: string;
}

/** Optional Hierarchy appearance stored on {@link Name}. */
export type NameAppearance = Pick<Name, 'icon' | 'color'>;

/**
 * Factory function to create a Name component data object.
 * @param value - The name string (defaults to "GameObject").
 * @param appearance - Optional Hierarchy icon and color.
 */
export const createName = (value = 'GameObject', appearance: NameAppearance = {}): Name => {
    const name: Name = { value };
    if (appearance.icon) name.icon = appearance.icon;
    if (appearance.color) name.color = appearance.color;
    return name;
};

/**
 * Typed handle for the Name component.
 */
export const Name = defineComponent<Name>('name', createName);
