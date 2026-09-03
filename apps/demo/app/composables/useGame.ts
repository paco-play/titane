import type { Ref } from 'vue';
import {
  TitaneEngine,
  Phase,
  createPhysicsPlayerControlSystem,
  deserializeWorld
} from '@titane/core';
import type { LivePreviewEnvelope } from '@titane/core';
import { ThreeRenderer } from '@titane/renderer';
import type { GameStatus } from '~/types/hud';
import { seedDropScene } from '~/game/seed';
import { tryLoadDropScene } from '~/game/load-scene';
import { bindGameplay, type GameplayBindings } from '~/game/bind-gameplay';
import { subscribeLivePreview, waitForLivePreview, wantsLivePreview } from '~/utils/live-preview';

/** Handle returned by {@link useGame}. */
export interface GameSession {
  status: Ref<GameStatus>;
  live: Ref<boolean>;
  boot: (canvas: HTMLCanvasElement) => Promise<void>;
  restart: () => void;
  dispose: () => void;
  onResize: () => void;
}

const engineRef = shallowRef<TitaneEngine | null>(null);
const rendererRef = shallowRef<ThreeRenderer | null>(null);
const status = ref<GameStatus>('playing');
const live = ref(false);

/**
 * Boots a headless (no editor chrome) Titane session for the Drop demo.
 * When opened as `?live=1` from the editor, the world is pushed over `postMessage`
 * and hot-reloaded on each later envelope.
 */
export const useGame = (): GameSession => {
  const route = useRoute();
  const config = useRuntimeConfig();
  const editorOrigin = String(config.public.editorOrigin);

  let bindings: GameplayBindings | null = null;
  let lastRevision = 0;
  let stopLive: (() => void) | null = null;

  const onFall = (): void => {
    const engine = engineRef.value;
    if (!engine || status.value === 'fallen') return;
    status.value = 'fallen';
    engine.isPaused = true;
  };

  const applyEnvelope = (envelope: LivePreviewEnvelope): void => {
    const engine = engineRef.value;
    const renderer = rendererRef.value;
    if (!engine || !renderer) return;
    if (envelope.revision <= lastRevision) return;

    lastRevision = envelope.revision;
    engine.loadWorld(deserializeWorld(envelope.world));
    bindings = bindGameplay(engine, renderer, onFall, bindings);
    engine.saveSnapshot();
    status.value = 'playing';
    engine.isPaused = false;
    live.value = true;
  };

  const boot = async (canvas: HTMLCanvasElement): Promise<void> => {
    if (engineRef.value) return;

    const renderer = new ThreeRenderer({ mode: 'game' });
    const engine = new TitaneEngine(renderer, canvas);
    await engine.ready;

    engineRef.value = engine;
    rendererRef.value = renderer;

    const fromEditor = wantsLivePreview(route.query);
    const first = fromEditor ? await waitForLivePreview(editorOrigin) : null;

    if (first) {
      applyEnvelope(first);
    } else {
      const loaded = await tryLoadDropScene(engine);
      if (!loaded) seedDropScene(engine.world);
      bindings = bindGameplay(engine, renderer, onFall, null);
      engine.saveSnapshot();
    }

    engine.addSystem(Phase.UPDATE, createPhysicsPlayerControlSystem());
    engine.isPaused = false;
    await engine.start();

    if (fromEditor) {
      stopLive = subscribeLivePreview(editorOrigin, applyEnvelope);
    }
  };

  const restart = (): void => {
    const engine = engineRef.value;
    if (!engine) return;
    engine.restoreSnapshot();
    status.value = 'playing';
    engine.isPaused = false;
  };

  const dispose = (): void => {
    stopLive?.();
    stopLive = null;
    engineRef.value?.stop();
    engineRef.value?.dispose();
    engineRef.value = null;
    rendererRef.value = null;
    bindings = null;
    lastRevision = 0;
    live.value = false;
    status.value = 'playing';
  };

  const onResize = (): void => {
    engineRef.value?.renderer.handleResize();
  };

  return {
    status,
    live,
    boot,
    restart,
    dispose,
    onResize
  };
};
