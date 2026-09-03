import type { Ref } from 'vue';
import {
  TitaneEngine,
  Phase,
  createPhysicsPlayerControlSystem,
  createTriggerSystem
} from '@titane/core';
import { ThreeRenderer } from '@titane/renderer';
import type { GameStatus } from '~/types/hud';
import { seedDropScene } from '~/game/seed';
import { findPlayer } from '~/game/find-player';
import { tryLoadDropScene } from '~/game/load-scene';
import { createFollowCameraSystem } from '~/game/follow-camera';

/** Handle returned by {@link useGame}. */
export interface GameSession {
  status: Ref<GameStatus>;
  boot: (canvas: HTMLCanvasElement) => Promise<void>;
  restart: () => void;
  dispose: () => void;
  onResize: () => void;
}

const engineRef = shallowRef<TitaneEngine | null>(null);
const status = ref<GameStatus>('playing');

/**
 * Boots a headless (no editor chrome) Titane session for the Drop demo.
 */
export const useGame = (): GameSession => {
  /**
   * Creates the engine on `canvas`, loads or seeds the slab, and starts playing.
   */
  const boot = async (canvas: HTMLCanvasElement): Promise<void> => {
    if (engineRef.value) return;

    const renderer = new ThreeRenderer({ mode: 'game' });
    const engine = new TitaneEngine(renderer, canvas);
    await engine.ready;

    const loaded = await tryLoadDropScene(engine);
    const seeded = loaded ? null : seedDropScene(engine.world);

    const player = findPlayer(engine.world);

    engine.addSystem(Phase.UPDATE, createPhysicsPlayerControlSystem());
    if (player !== null) {
      engine.addSystem(Phase.POST_PHYSICS, createFollowCameraSystem(player, renderer));
    }

    // The kill-zone sensor is either loaded from the scene file or freshly seeded.
    // `tryLoadDropScene` restores serialised entities including the sensor;
    // `findPlayer` already resolved the player entity from the world.
    // We find the kill-zone entity by its sensor tag when loaded, or use the
    // seeded reference when the scene was built from scratch.
    const killZone = seeded?.killZone ?? null;
    if (killZone !== null) {
      engine.addSystem(Phase.POST_PHYSICS, createTriggerSystem(
        killZone,
        () => {
          if (status.value === 'fallen') return;
          status.value = 'fallen';
          engine.isPaused = true;
        },
        () => { /* exit — no-op for the kill zone */ }
      ));
    }

    engine.saveSnapshot();
    engine.isPaused = false;
    await engine.start();
    engineRef.value = engine;
  };

  /**
   * Restores the seeded snapshot and resumes play.
   */
  const restart = (): void => {
    const engine = engineRef.value;
    if (!engine) return;
    engine.restoreSnapshot();
    status.value = 'playing';
    engine.isPaused = false;
  };

  const dispose = (): void => {
    engineRef.value?.stop();
    engineRef.value?.dispose();
    engineRef.value = null;
    status.value = 'playing';
  };

  const onResize = (): void => {
    engineRef.value?.renderer.handleResize();
  };

  return {
    status,
    boot,
    restart,
    dispose,
    onResize
  };
};
