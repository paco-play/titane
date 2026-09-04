import {
    addComponent,
    applyTitaneConfig,
    createPrimitive,
    deserializeWorld,
    TitaneEngine,
    type SerializedWorld
} from '@titane/core';
import { ThreeRenderer } from '@titane/renderer';
import { titaneConfig } from '../titane.config';
import { PlayerController } from './components/PlayerController';
import sceneRaw from '../scenes/main.titane?raw';

const canvas = document.querySelector('#game');
if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('[Titane] Missing #game canvas.');
}

const renderer = new ThreeRenderer({ mode: 'game' });
const engine = new TitaneEngine(renderer, canvas);
await engine.ready;
applyTitaneConfig(engine, titaneConfig);

try {
    const data = JSON.parse(sceneRaw) as SerializedWorld;
    engine.loadWorld(deserializeWorld(data));
}
catch {
    const cube = createPrimitive(engine.world, { name: 'Cube', color: '#4ade80' });
    addComponent(engine.world, cube, PlayerController, PlayerController.create());
}

renderer.setCamera({
    position: { x: 5, y: 4, z: 8 },
    lookAt: { x: 0, y: 0.5, z: 0 }
});
engine.isPaused = false;
await engine.start();
canvas.focus();

window.addEventListener('resize', () => {
    engine.renderer.handleResize();
});
