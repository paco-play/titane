import type { System, TitaneEngine } from '@titane/core';
import { Phase, createTriggerSystem } from '@titane/core';
import type { ThreeRenderer } from '@titane/renderer';
import { findPlayer } from './find-player';
import { findKillZone } from './find-kill-zone';
import { createFollowCameraSystem } from './follow-camera';

/** Systems that close over entity IDs and must be rebuilt after a live load. */
export interface GameplayBindings {
  follow: System | null;
  trigger: System | null;
}

/**
 * Rebinds player follow and kill-zone trigger after the world is replaced.
 * Player control stays registered: it queries `PlayerControlled` each tick.
 */
export const bindGameplay = (
  engine: TitaneEngine,
  renderer: ThreeRenderer,
  onFall: () => void,
  previous: GameplayBindings | null
): GameplayBindings => {
  if (previous?.follow) engine.removeSystem(Phase.POST_PHYSICS, previous.follow);
  if (previous?.trigger) engine.removeSystem(Phase.POST_PHYSICS, previous.trigger);

  const player = findPlayer(engine.world);
  const follow = player === null ? null : createFollowCameraSystem(player, renderer);
  if (follow) engine.addSystem(Phase.POST_PHYSICS, follow);

  const killZone = findKillZone(engine.world);
  const trigger = killZone === null
    ? null
    : createTriggerSystem(killZone, () => { onFall(); }, () => undefined);
  if (trigger) engine.addSystem(Phase.POST_PHYSICS, trigger);

  return { follow, trigger };
};
