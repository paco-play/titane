import { defineComponent } from '../kernel/registry';

/**
 * Tag component marking an entity as driven by the player's input.
 * Carries no data: presence on an entity is the whole signal.
 */
export type PlayerControlled = Record<string, never>;

/**
 * Factory producing the empty payload of the tag.
 */
export const createPlayerControlled = (): PlayerControlled => ({});

/**
 * Typed handle for the PlayerControlled tag.
 */
export const PlayerControlled = defineComponent<PlayerControlled>(
    'player-controlled',
    createPlayerControlled
);
