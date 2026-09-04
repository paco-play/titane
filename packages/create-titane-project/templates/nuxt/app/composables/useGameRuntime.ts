import type { TitaneEngine, SerializedWorld } from '@titane/core';
import {
    addComponent,
    applyTitaneConfig,
    createPrimitive,
    deserializeWorld,
    TitaneEngine as Engine
} from '@titane/core';
import { ThreeRenderer } from '@titane/renderer';
import { titaneConfig } from '~~/titane.config';
import { PlayerController } from '../../src/components/PlayerController';

const SCENE_URL = '/scenes/main.titane';

/**
 * Loads `scenes/main.titane` when Nitro serves it. Returns false on a miss.
 */
const tryLoadScene = async (engine: TitaneEngine): Promise<boolean> => {
    try {
        const response = await fetch(SCENE_URL);
        if (!response.ok) return false;
        const data = await response.json() as SerializedWorld;
        if (typeof data.version !== 'number' || !Array.isArray(data.entities)) return false;
        engine.loadWorld(deserializeWorld(data));
        return true;
    }
    catch {
        return false;
    }
};

/**
 * Fullscreen game session: core + renderer + scene + scripts. No editor chrome.
 */
export const useGameRuntime = () => {
    const engineRef = shallowRef<TitaneEngine | null>(null);

    const boot = async (canvas: HTMLCanvasElement): Promise<void> => {
        if (engineRef.value) return;

        const renderer = new ThreeRenderer({ mode: 'game' });
        const engine = new Engine(renderer, canvas);
        await engine.ready;
        applyTitaneConfig(engine, titaneConfig);

        const loaded = await tryLoadScene(engine);
        if (!loaded) {
            const cube = createPrimitive(engine.world, { name: 'Cube', color: '#4ade80' });
            addComponent(engine.world, cube, PlayerController, PlayerController.create());
        }

        renderer.setCamera({
            position: { x: 5, y: 4, z: 8 },
            lookAt: { x: 0, y: 0.5, z: 0 }
        });
        engine.isPaused = false;
        await engine.start();
        engineRef.value = engine;
    };

    const dispose = (): void => {
        engineRef.value?.stop();
        engineRef.value?.dispose();
        engineRef.value = null;
    };

    const onResize = (): void => {
        engineRef.value?.renderer.handleResize();
    };

    return { boot, dispose, onResize };
};
