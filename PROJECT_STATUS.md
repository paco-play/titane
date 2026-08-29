# Titane Engine - Project Status & Roadmap

## Current Vision
A data-oriented, ECS-based 3D game engine with a small, fully typed public API.
- **Core:** entity storage, typed component registry, query engine, phase scheduler, game loop.
- **Renderer:** pluggable driver behind `IRenderer` (currently Three.js).
- **Editor:** Nuxt 4 visual interface.

## Project Structure (Monorepo)
- `packages/core`: the whole engine (ECS kernel, pipeline, components, systems, serialization, runtime, Three.js driver).
- `apps/editor`: the Nuxt 4 editor UI.

> `packages/renderer` does not exist yet. The Three.js driver currently lives in
> `packages/core/src/rendering/`, so `three` is a direct dependency of the core.

## Architecture Rules
1. **Entities** are just `number` IDs.
2. **Components** are pure data, declared through `defineComponent` and addressed by their typed handle.
3. **Systems** are functions registered into a `Phase`, iterating over reusable queries.
4. **Public API** must be used for all modifications (`World._stores` is internal).
5. **No `any`, no `ts-ignore`** anywhere in the codebase.
6. **No gameplay in the core.** Generic systems only; opinionated behaviour is opt-in.

## Quality Gates
| Command | Checks |
| --- | --- |
| `npm test` | 50 tests across 11 files (Vitest) |
| `npm run typecheck` | `tsc -b` on the core, `vue-tsc` on the editor |
| `npm run lint` | ESLint on the editor |

---

## Current Milestone
**Typed Component Core** — done. Next up: renderer extraction and viewport interaction.

## Completed

### Hierarchy Integrity
Reported symptom: nesting a cube under a parent then deleting the parent left the child on screen,
and a refresh brought back a duplicate. Five distinct defects were behind it, each now covered by a
regression test in `tests/ecs/hierarchy-integrity.test.ts`.

- [x] **`destroyEntity` cascades to the subtree.** It only removed the entity itself, so children survived their parent. They kept rendering (the transform pass treats an orphan as a root) while `useHierarchy` filtered them out of the tree, since it only lists entities whose parent is `null`. The badge counted them, the tree did not show them, and the viewport drew them.
- [x] **Descendant IDs are recycled** along with the root, instead of leaking.
- [x] **A recycled ID no longer adopts stale children.** After deleting a parent, its freed ID went back into the pool. The next created entity reused it and silently inherited the dead parent's orphans, which is where the phantom duplicate came from.
- [x] **The free list is persisted.** `serializeWorld` saved `nextId` and the active set but not `recycled`, so a reload allocated IDs differently from the session that saved it.
- [x] **`cloneEntity` duplicates the whole subtree**, remapping internal parent links onto the copies while the root keeps its original parent. Duplicating a parent used to silently drop its children.
- [x] **The editor's root detection matches the engine's.** An entity whose parent is no longer alive is now shown at the root, so the tree, the count badge and the viewport can no longer disagree about what exists.

### Typed ECS Core
- [x] **Component descriptors**: `defineComponent<T>()` returning a branded `ComponentType<T>` that carries its data type. `getComponent(world, e, Transform)` now infers `Transform | undefined` with no generic argument and no cast.
- [x] **Indexed storage**: `World._stores` is an array indexed by `ComponentType.index`. Array offsets replaced string hashing on every component access.
- [x] **Single erasure boundary**: exactly one cast in the whole kernel, in `getStore`. Every accessor built on it is cast-free.
- [x] **Zero-allocation queries**: `defineQuery` / `runQuery` recycle their result and store buffers, so a system iterating entities allocates nothing per frame.
- [x] **Registry-driven serialization**: `.titane` files are versioned, and each component revives its own data through an optional `revive` hook. Removed the hardcoded `if (componentId === 'transform')` fixup and the last `any` of the core.
- [x] **Public system API**: `Phase`, `registerSystem`, `unregisterSystem`, `Scheduler` are exported, plus `engine.addSystem(phase, system)` and `engine.tick()`.
- [x] **Broke the circular dependency** between `runtime/engine.ts` and `ecs/pipeline/setup.ts`.
- [x] **Deduplicated the `System` type**, previously declared in both `ecs/types` and `ecs/pipeline/system`.
- [x] **Gameplay out of the core**: `movementSystem` split into the generic `integrateVelocitySystem` (core, always registered) and `createPlayerControlSystem` (opt-in, registered by the editor). This also removed an O(n^2) query nested inside the entity loop.
- [x] **In-place world swaps**: `restoreSnapshot` and `loadWorld` copy data without replacing the `World` object, so the input driver, renderer and editor UI never hold a dead reference.
- [x] **`cloneEntity`** in the kernel, so the editor no longer walks the internal stores by hand to duplicate an entity.
- [x] **Orphan transforms** (parent set but parent has no `Transform`) are treated as roots instead of being skipped.
- [x] **Zero-allocation transform pass**: parallel BFS buffers replaced the per-entity node objects.

### Earlier Foundations
- [x] **Functional ECS Core**: strict data/logic separation (Entity, Component, Query).
- [x] **Renderer Decoupling**: `IRenderer` injected into `TitaneEngine`.
- [x] **Advanced Runtime**: `TitaneEngine` with a phase scheduler and a precision `Clock` for frame-independent movement.
- [x] **Transform Hierarchy**: `LocalTransform` vs `WorldTransform` with dirty-flag propagation, parenting, and a recursive tree UI.
- [x] **Matrix math**: in-place, allocation-free 4x4 utilities (column-major, WebGL compatible).
- [x] **Input System**: keyboard/mouse captured into the ECS, with a one-frame `justPressed` impulse cleanup.
- [x] **Scene Persistence**: JSON serialization, file save/open in the editor, LocalStorage recovery buffer.
- [x] **Memory Management**: automatic GPU resource `dispose` for entities that stop rendering.
- [x] **Modular Editor UI**: Inspector, Hierarchy and Topbar split into small components with encapsulated composables.
- [x] **Simulation Control**: Play/Pause via `useRuntime`, snapshot on play, revert on stop.
- [x] **Smart / Dumb split in the Inspector**: `Inspector/Item.vue` is now purely presentational and emits `update` / `commit` instead of mutating its props.
- [x] **Typecheck tooling**: `vue-tsc` installed and `typecheck` scripts wired at the root, in the core and in the editor. Nothing guarded the editor's types before.
- [x] **Lint config fixed**: the base `indent` rule conflicted with `vue/script-indent` inside `.vue` files, producing contradictory unfixable errors. `indent` is now disabled for `.vue`, and the 550 outstanding violations are cleared.

---

## Next Tasks

### 1. Renderer Extraction (High Priority)
1. **Move the Three.js driver** out of `packages/core/src/rendering/` into a `packages/renderer` workspace so `three` stops being a core dependency, and the "the core knows nothing about Three.js" claim becomes true.
2. **Honour `MeshData.primitive`**: `ThreeRenderer` currently always builds a `BoxGeometry`, so a sphere or a plane renders as a box.
3. **React to material changes**: `MeshData.color` is only read when the object is first created.
4. **Share geometry and materials** across entities instead of allocating one pair per entity, as a first step towards instancing.
5. **Move `setGridVisible` off `IRenderer`**: grid visibility is an editor concern leaking into the driver contract.

### 2. Viewport Interaction (High Priority)
1. **Raycasting**: select an entity by clicking its mesh in the viewport.
2. **Orbit camera**: the camera is currently fixed at `(5, 5, 5)` looking at the origin.
3. **Transformation gizmos**: on-screen translate/rotate/scale handles for the selection.
4. **Manual "Reset Scene"**: revert to the initial snapshot without reloading the page.

### 3. Editor Performance (Medium Priority)
1. **`useHierarchy` is O(n^2)**: `buildHierarchyLevels` re-filters the full entity list at every depth. Build the parent-to-children index once per recomputation.
2. **Auto-save granularity**: the editor watches the entity `Set`, so it only reacts to structural changes and otherwise re-serializes the entire world on a timer. Component edits deserve a cheaper dirty-tracking path.

### 4. Storage & Scale (Medium Priority)
1. **Archetype / SoA storage**: move hot components into dense `Float32Array` buffers. The `ComponentType.index` indirection introduced in this milestone is the seam that makes this swap possible without touching call sites.
2. **Query caching**: keep query results across frames and invalidate them on structural change, instead of rescanning the smallest store.

### 5. Simulation (Medium Priority)
1. **Rapier (WASM) integration** in the `PHYSICS` phase. The dependency is already declared but unused.
2. **Fixed timestep** for physics, decoupled from the render frame rate.
3. **Proper single-step**: `useRuntime.stepFrame` currently unpauses and re-pauses via a 16 ms `setTimeout`; it should drive `engine.tick()` directly.

### 6. Deprioritized
1. **File System Access API**: native `CTRL+S` overwriting a file on disk without re-downloading.
2. **Asset metadata**: structure for tracking external dependencies (textures, glTF models).
