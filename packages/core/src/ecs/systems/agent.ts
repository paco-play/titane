import type { World } from '../kernel/world';
import type { System } from '../pipeline/system';
import { defineQuery, runQuery } from '../kernel/query';
import { getComponent, hasComponent } from '../kernel/component';
import { Transform } from '../components/transform';
import { RigidBody } from '../components/rigid-body';
import { Agent } from '../components/agent';
import {
    Nav,
    navCellWorld,
    navHasGrid,
    navIsWalkable,
    worldToNavCell,
    type NavData
} from '../components/nav';
import { pickNav } from '../kernel/nav-utils';
import { findNavPath } from '../../nav/astar';
import { getPhysicsSession } from '../../physics/session';

const agentQuery = defineQuery([Agent, Transform]);

const IDENTITY_ROTATION = { x: 0, y: 0, z: 0, w: 1 };
const ZERO_ANGVEL = { x: 0, y: 0, z: 0 };

/**
 * Moves `Agent` entities along baked nav toward `destination`.
 * Dynamic Rapier bodies get XZ linvel; everyone else writes Transform.
 */
export const agentSystem: System = (world: World, deltaTime: number): void => {
    const navEntity = pickNav(world);
    if (navEntity === null) return;
    const nav = getComponent(world, navEntity, Nav);
    if (!nav || !navHasGrid(nav)) return;

    const session = getPhysicsSession(world);

    for (const entity of runQuery(world, agentQuery)) {
        const agent = getComponent(world, entity, Agent);
        const transform = getComponent(world, entity, Transform);
        if (!agent || !transform || agent.speed <= 0) continue;

        const start = nearestWalkable(nav, transform.position.x, transform.position.z);
        const goal = nearestWalkable(nav, agent.destination.x, agent.destination.z);
        if (!start || !goal) {
            stopHorizontal(world, entity, session);
            continue;
        }

        const path = findNavPath(nav, start, goal);
        if (!path || path.length === 0) {
            stopHorizontal(world, entity, session);
            continue;
        }

        const last = path[path.length - 1];
        const onGoal = start.ix === last.ix && start.iz === last.iz;
        const target = onGoal
            ? { x: agent.destination.x, z: agent.destination.z }
            : nextWaypoint(nav, path, transform.position);
        const dx = target.x - transform.position.x;
        const dz = target.z - transform.position.z;
        const dist = Math.hypot(dx, dz);
        const arrive = Math.max(0.12, nav.cellSize * 0.35);
        if (dist <= arrive && onGoal) {
            stopHorizontal(world, entity, session);
            continue;
        }
        if (dist < 1e-6) continue;

        const inv = 1 / dist;
        const vx = dx * inv * agent.speed;
        const vz = dz * inv * agent.speed;
        applyMotion(world, entity, transform, session, vx, vz, deltaTime);
    }
};

const nearestWalkable = (
    nav: NavData,
    x: number,
    z: number
): { ix: number; iz: number } | null => {
    const direct = worldToNavCell(nav, x, z);
    if (direct && navIsWalkable(nav, direct.ix, direct.iz)) return direct;

    let best: { ix: number; iz: number } | null = null;
    let bestDist = Infinity;
    const radius = 3;
    const seed = direct ?? {
        ix: Math.floor((x - nav.originX) / nav.cellSize),
        iz: Math.floor((z - nav.originZ) / nav.cellSize)
    };
    for (let iz = seed.iz - radius; iz <= seed.iz + radius; iz++) {
        for (let ix = seed.ix - radius; ix <= seed.ix + radius; ix++) {
            if (!navIsWalkable(nav, ix, iz)) continue;
            const world = navCellWorld(nav, ix, iz);
            const dist = Math.hypot(world.x - x, world.z - z);
            if (dist < bestDist) {
                bestDist = dist;
                best = { ix, iz };
            }
        }
    }
    return best;
};

const nextWaypoint = (
    nav: NavData,
    path: readonly { ix: number; iz: number }[],
    position: { x: number; z: number }
): { x: number; z: number } => {
    const skip = Math.max(0.08, nav.cellSize * 0.25);
    for (let i = 1; i < path.length; i++) {
        const world = navCellWorld(nav, path[i].ix, path[i].iz);
        if (Math.hypot(world.x - position.x, world.z - position.z) > skip) {
            return { x: world.x, z: world.z };
        }
    }
    const last = path[path.length - 1];
    const world = navCellWorld(nav, last.ix, last.iz);
    return { x: world.x, z: world.z };
};

type Session = ReturnType<typeof getPhysicsSession>;

const applyMotion = (
    world: World,
    entity: number,
    transform: Transform,
    session: Session,
    vx: number,
    vz: number,
    deltaTime: number
): void => {
    const rigid = getComponent(world, entity, RigidBody);
    const binding = rigid?.kind === 'dynamic' ? session?.bodies.get(entity) : undefined;
    if (binding) {
        binding.body.lockRotations(true, true);
        binding.body.setAngvel(ZERO_ANGVEL, true);
        binding.body.setRotation(IDENTITY_ROTATION, true);
        const current = binding.body.linvel();
        binding.body.setLinvel({ x: vx, y: current.y, z: vz }, true);
        return;
    }
    if (hasComponent(world, entity, RigidBody) && rigid?.kind === 'fixed') return;
    transform.position.x += vx * deltaTime;
    transform.position.z += vz * deltaTime;
    transform.isDirty = true;
};

const stopHorizontal = (world: World, entity: number, session: Session): void => {
    const rigid = getComponent(world, entity, RigidBody);
    const binding = rigid?.kind === 'dynamic' ? session?.bodies.get(entity) : undefined;
    if (!binding) return;
    const current = binding.body.linvel();
    binding.body.setLinvel({ x: 0, y: current.y, z: 0 }, true);
};
