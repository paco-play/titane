import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorld } from '../src/ecs/kernel/world';
import { createEntity } from '../src/ecs/kernel/entity';
import { addComponent } from '../src/ecs/kernel/component';
import { createPrimitive } from '../src/ecs/kernel/factory';
import { serializeWorld } from '../src/ecs/serialization';
import { RigidBody, createRigidBody } from '../src/ecs/components/rigid-body';
import { PlayerControlled, createPlayerControlled } from '../src/ecs/components/player-controlled';

const SLAB_SIZE = 12;
const CRATE_OFFSETS: readonly { x: number; z: number }[] = [
    { x: 2, z: -1 },
    { x: -2.2, z: 1.4 },
    { x: 1.4, z: 2.2 }
];

const world = createWorld();
createEntity(world);

const ground = createPrimitive(world, {
    name: 'Ground',
    primitive: 'box',
    color: '#3f3f46',
    position: { x: 0, y: -0.25, z: 0 },
    scale: { x: SLAB_SIZE, y: 0.5, z: SLAB_SIZE }
});
addComponent(world, ground, RigidBody, createRigidBody('fixed'));

const player = createPrimitive(world, {
    name: 'Player',
    primitive: 'sphere',
    color: '#4ade80',
    position: { x: 0, y: 1.5, z: 0 }
});
addComponent(world, player, RigidBody, createRigidBody('dynamic'));
addComponent(world, player, PlayerControlled, createPlayerControlled());

for (const [index, offset] of CRATE_OFFSETS.entries()) {
    const crate = createPrimitive(world, {
        name: `Crate ${index + 1}`,
        primitive: 'box',
        color: '#f59e0b',
        position: { x: offset.x, y: 2 + index * 0.9, z: offset.z },
        scale: { x: 0.8, y: 0.8, z: 0.8 }
    });
    addComponent(world, crate, RigidBody, createRigidBody('dynamic'));
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '../../../apps/demo/public');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'drop.titane'), `${JSON.stringify(serializeWorld(world), null, 2)}\n`);
