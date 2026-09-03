import type { Ref } from 'vue';
import {
  TitaneEngine,
  initPhysics,
  Phase,
  createPhysicsPlayerControlSystem
} from '@titane/core';
import { ThreeRenderer } from '@titane/renderer';
import type { GameStatus } from '~/types/hud';
import { FALL_Y } from '~/game/constants';
import { seedDropScene } from '~/game/seed';
import { createLoseSystem } from '~/game/lose-system';
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
   * Creates the engine on `canvas`, seeds the slab, and starts playing.
   */
  const boot = async (canvas: HTMLCanvasElement): Promise<void> => {
    if (engineRef.value) return;

    await initPhysics();

    const renderer = new ThreeRenderer({ mode: 'game' });
    const engine = new TitaneEngine(renderer, canvas);
    const { player } = seedDropScene(engine.world);

    engine.addSystem(Phase.UPDATE, createPhysicsPlayerControlSystem());
    engine.addSystem(Phase.UPDATE, createLoseSystem(player, FALL_Y, () => {
      if (status.value === 'fallen') return;
      status.value = 'fallen';
      engine.isPaused = true;
    }));
    engine.addSystem(Phase.POST_PHYSICS, createFollowCameraSystem(player, renderer));

    engine.saveSnapshot();
    engine.isPaused = false;
    engine.start();
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
