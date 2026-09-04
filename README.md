# Titane Engine

**Titane** is a data-oriented 3D engine (ECS) designed for high-performance web. It strictly separates business logic, visual rendering, and world state to provide production stability and scalability.

---

## Philosophy & Vision

3D development on the web often suffers from coupling that is too tight between visual objects and game logic. **Titane** solves this problem by applying three fundamental principles:

1.  **Single Source of Truth (ECS)**: All world state resides in a system of pure Entities and Components. No hidden data in rendering objects.
2.  **Rendering Agnosticism**: The engine's core is a "logical fortress". It communicates with the graphics API through interchangeable **Drivers**.
3.  **Typed by construction**: A component's data type travels with its handle, so the public API needs no generic arguments and no casts. If it compiles, the shapes line up.

---

## Quick Start

From this repository:

```bash
npm run create -- --name my-game --template nuxt --yes
cd my-game
npm run dev
```

Game at `/`, editor at `/titane`. Details: [docs/getting-started.md](docs/getting-started.md).

```typescript
import {
  TitaneEngine, Phase,
  defineComponent, defineQuery, runQuery,
  createPrimitive, getComponent, addComponent,
  Transform, Velocity, createVelocity
} from '@titane/core';
import { ThreeRenderer } from '@titane/renderer';

const engine = new TitaneEngine(new ThreeRenderer(), canvas);

// 1. Spawn something visible
const player = createPrimitive(engine.world, { name: 'Player', position: { x: 0, y: 5, z: 0 } });
addComponent(engine.world, player, Velocity, createVelocity(0, -2, 0));

// 2. Declare your own component
interface Health { current: number }
const Health = defineComponent<Health>('health', () => ({ current: 100 }));
addComponent(engine.world, player, Health, { current: 100 });

// 3. Declare a query once, reuse it every frame (zero allocation)
const damageable = defineQuery([Transform, Health]);

// 4. Register your system into a lifecycle phase
engine.addSystem(Phase.UPDATE, (world, deltaTime) => {
  for (const entity of runQuery(world, damageable)) {
    const transform = getComponent(world, entity, Transform); // Transform | undefined
    const health = getComponent(world, entity, Health);       // Health | undefined
    if (!transform || !health) continue;

    if (transform.position.y < 0) health.current -= 10 * deltaTime;
  }
});

engine.isPaused = false;
engine.start();
```

`getComponent(world, entity, Health)` returns `Health | undefined`. There is no generic argument to
pass and no cast to write, because the handle returned by `defineComponent` carries the type. Asking
for the wrong component is a compile error rather than a silent `undefined` at runtime.

---

## Roadmap

| Phase | Focus | Key Objective | Status |
| :--- | :--- | :--- | :--- |
| **1. Foundations** | ECS Core | Stable kernel, phase scheduler, Three.js driver, versioned scene format. | Done |
| **2. Typed Core** | Public API | `defineComponent` handles, zero-allocation queries, open system registration. | Done |
| **3. Elite Editor** | Visual Tooling | Hierarchy, dynamic Inspector, live sync. | Done |
| **4. Renderer Split** | Decoupling | Extract `packages/renderer`, primitive support, resource pooling. | Done |
| **5. Interaction** | Viewport | Raycast selection, orbit camera, transform gizmos. | Done |
| **6. Simulation** | Physics | Rapier (WASM) in the PHYSICS phase, fixed timestep. | Done |
| **7. Scale** | Storage | Archetype / SoA buffers, cached queries, instancing. | Done |
| **8. Game demo** | Public API | Nuxt Drop loop: game-mode renderer, Rapier player, snapshot restart. | Done |
| **9. Author → Play** | Pipeline | Scale on spawn, engine physics ready, RigidBody in the Inspector, demo loads a `.titane`. | Done |
| **10. Character feel** | Gameplay | Locked rotations, grounded raycast, Space jump. | Done |

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the detailed task breakdown.

---

## Architecture & Structure

- `packages/core` — the engine: ECS kernel, execution pipeline, standard components, built-in systems, scene serialization, runtime orchestrator. Imports no graphics library.
- `packages/renderer` — the Three.js driver implementing `IRenderer`. The only package that imports `three`.
- `apps/editor` — the Nuxt 4 editor UI (also a dev-only layer at `/titane`).
- `apps/demo` — a Nuxt 4 game that uses the engine without editor chrome.
- `packages/create-titane-project` — `npm run create` (`nuxt` / `vanilla`).

For an in-depth look at the internal data flow, ECS definitions and the engine loop, read the [Architecture Specification](ARCHITECTURE.md).

```mermaid
graph TD
    A[Game Logic] -->|"defineComponent / addSystem"| B(Public API)
    subgraph engine [packages/core]
    B --> C{ECS World}
    C --> D[Phase Scheduler]
    D --> E["Component Stores<br/>indexed by ComponentType.index"]
    end
    C -->|worldMatrix sync| F[IRenderer Driver]
    subgraph renderer ["packages/renderer"]
    F --> G[ThreeRenderer]
    end
```

The core declares no graphics dependency: `three` lives in `packages/renderer` alone. Targeting
WebGPU, or running headless in a test harness, means adding a package beside it and changing nothing
in the engine.

## Useful Commands

```bash
# Scaffold a game (nuxt: editor at /titane, vanilla: canvas only)
npm run create

# Run the editor with HMR (http://localhost:3000/titane)
npm run editor:dev

# Run the Drop demo (no editor chrome) on http://localhost:3001
npm run demo:dev

# Compile the engine packages in watch mode
npm run core:dev
npm run renderer:dev

# Quality gates
npm test          # Vitest suites on the core and the renderer
npm run build     # tsc on the core, then the renderer
npm run typecheck # tsc on core and renderer, vue-tsc on the editor and the demo
npm run lint      # ESLint on the editor and the demo
```

The editor and the demo consume the packages' build output, so run `npm run build` once beforehand, or keep
`npm run core:dev` and `npm run renderer:dev` running alongside `npm run editor:dev` / `npm run demo:dev`.

## Framework Agnostic

Although Titane's official editor is powered by Nuxt 4, the engine itself is an independent
TypeScript library. Nothing in `packages/core` imports Vue, so the runtime drops into Vanilla
TS, React, Svelte or anything else. Titane does not impose a UI framework upon you; it simply
powers your 3D world.

## Tech Stack

- **Core Engine**: TypeScript (Data-Oriented Design), strict mode, no `any`
- **Architecture**: ECS with a deterministic phase scheduler
- **Renderer**: Driver-based, in its own package (Default: Three.js)
- **Editor**: Nuxt 4 + Nuxt UI
- **Tests**: Vitest
- **Physics**: Rapier (WASM) via `@dimforge/rapier3d-compat`
