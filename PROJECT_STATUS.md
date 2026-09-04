# Titane Engine - Project Status & Roadmap

## Current Vision
A data-oriented, ECS-based 3D **game engine** with a small, fully typed public API.
The product is the loop **user TypeScript → ECS component → Inspector → Play**, not a scene viewer with more shaders.
- **Core:** entity storage, typed component registry, query engine, phase scheduler, game loop.
- **Renderer:** pluggable driver behind `IRenderer` (currently Three.js).
- **Editor:** Nuxt 4 visual interface.

## Project Structure (Monorepo)
- `packages/core`: the engine (ECS kernel, pipeline, components, systems, serialization, runtime). No graphics dependency.
- `packages/renderer`: the Three.js driver. The only package importing `three`.
- `apps/editor`: the Nuxt 4 editor UI, also a **dev-only Nuxt layer** (`/titane`).
- `apps/demo`: a Nuxt 4 game that boots the engine with no editor chrome.
- `packages/create-titane-project`: `npm run create` scaffold (`nuxt` / `vanilla`).

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
| `npm test` | Vitest on the core, the renderer, the editor, and the scaffold |
| `npm run build` | `tsc -b` on the core, then the renderer |
| `npm run typecheck` | `tsc -b` on core and renderer, `vue-tsc` on the editor and the demo, `tsc` on the scaffold |
| `npm run lint` | ESLint on the editor and the demo |

---

## Current Milestone
**Phase 3 — Distributable product** (in this branch). Phase 2 is on `release`. Next after merge: Phase 4 unfreeze. Rendering stays frozen until Phase 4. Contract: `docs/ROADMAP.md`.

## Completed

### Live editor → demo session
- [x] **Preview envelope.** `createLivePreviewEnvelope` / `parseLivePreviewEnvelope` in core. Typed `postMessage` payload with a revision so stale frames are ignored.
- [x] **Editor publish.** Menu → Preview in Demo opens `demoUrl/?live=1`. Each `saveToStorage` (and the ready handshake) posts the current world to that tab.
- [x] **Demo subscribe.** `?live=1` waits for the first envelope, then hot-reloads later ones. Timeout falls back to `drop.titane` / seed. A "Live from editor" badge shows when a push landed.
- [x] **Gameplay rebind.** `bindGameplay` drops the previous follow / trigger systems (they close over entity IDs) and attaches new ones after `findPlayer` / `findKillZone`. `engine.removeSystem` is the public seam.
- [x] **Kill zone on loaded scenes.** The demo now finds a `Sensor` tagged `kill-zone` after a file or live load, not only after `seedDropScene`.

### Audio
- [x] **`Sound` component.** `url`, `volume`, `loop`, `positional`, `playing`. Empty URL is silent. Pose for positional sources comes from `Transform`.
- [x] **`AudioPool`.** One decoded buffer per URL, one voice per entity. `play()` only on the rising edge of `playing` so a one-shot is not restarted every frame.
- [x] **Listener.** `AudioListener` on the camera. A canvas `pointerdown` resumes the AudioContext (browser gesture rule).
- [x] **Inspector + Hierarchy.** Dumb Sound section (URL, volume, loop, positional, playing, remove). Hierarchy `+` spawns a Sound entity.

### glTF import
- [x] **`Gltf` component.** `url` string. Empty draws nothing. Pose stays on `Transform`.
- [x] **`ModelPool`.** Loads each URL once, clones per entity, cancels stale loads, disposes the template when the last user drops.
- [x] **Picking.** Loaded roots are raycast with the instanced batches. A hit walks up to `userData.titaneEntity`.
- [x] **Gizmo on model-only entities.** The proxy syncs from the selected `Transform` even when there is no `Mesh`.
- [x] **Inspector + Hierarchy.** Dumb URL field / remove; Hierarchy `+` spawns a Model entity without a primitive mesh.

### Engine plugin
- [x] **`engine.use(plugin)`.** `TitanePlugin` is `{ name, register(engine) }`. Duplicate or empty names throw. A plugin registers systems through the public engine API — no fork of core.

### User components
- [x] **Schema DSL `f.*`.** `number`, `boolean`, `string`, `color`, `vec3`, `quat`, `enum`, `entity`. `InferSchema` is the data type; defaults and deserialize validation come from the same record.
- [x] **User `defineComponent`.** `defineComponent('PlayerController', { schema, onStart, onUpdate, onDestroy })`. Built-ins keep the factory form.
- [x] **Batched lifecycle.** `engine.registerComponent` lists the type for Add Component and installs one UPDATE system per type. Hooks run only while simulating (Play / Step), never on a paused editor tick. `World._epoch` re-runs `onStart` after a snapshot restore.
- [x] **Orphan payloads.** Unknown `.titane` component ids are kept, round-tripped, cloned and destroyed with the entity. Inspector shows a missing-script row.
- [x] **Auto Inspector + Add Component.** Schema fields map to widgets. The editor sample `PlayerController` is registered through `gameplayPlugin`; Inspector source does not special-case that type.

### Iteration loop
- [x] **Play-in-place.** Play disables orbit, gizmos and the grid on the existing viewport (`setEditorChromeEnabled`). A Playing badge marks the mode. Picking is off while Playing.
- [x] **Keep / Discard.** Stopping Play freezes the sim and asks. Discard restores the pre-Play snapshot. Keep leaves Play edits as the edit scene and saves.
- [x] **Script HMR.** A second `defineComponent` with the same id patches schema and hooks in place. `engine.reloadUserComponent` rebakes live instances. The editor accepts `PlayerController.ts` over Vite HMR.
- [x] **Isolated script errors.** `onStart` / `onUpdate` / `onDestroy` throws skip that entity and surface a banner. The engine tick continues.

### Distributable product
- [x] **Project convention.** `scenes/`, `src/components/`, `public/assets/`, `titane.config.ts`. `TitaneConfig` / `applyTitaneConfig` in core.
- [x] **`create-titane-project`.** Three questions (name, template, install). Templates: Nuxt (editor in dev) and vanilla Vite. `file:` links into the Titane checkout.
- [x] **Embedded editor.** Standalone editor and generated Nuxt apps serve the chrome at `/titane`. The default layout is a passthrough so a game page at `/` is not wrapped in Hierarchy / Inspector.
- [x] **Prod strip.** Generated `nuxt.config` extends `@titane/editor` only when `NODE_ENV !== 'production'`.
- [x] **Docs.** Getting started, ECS, writing a component, light API reference.

### Shadows
- [x] **`Light.castShadow`.** Directional and point lights write a shadow map. Ambient ignores the flag. Default `false`. Older scenes revive with `false`.
- [x] **`Mesh.castShadow` / `Mesh.receiveShadow`.** Defaults `true`. Instanced batches split when the flags differ.
- [x] **Renderer.** `shadowMap.enabled` with PCF soft shadows. Fixed directional ortho frustum; point far follows `distance`.
- [x] **Inspector.** Checkboxes on Mesh; Cast shadow on Light (hidden for ambient).

### Mesh material
- [x] **`Mesh.roughness` / `Mesh.metalness` / `Mesh.emissive`.** PBR fields on `MeshData`. Defaults match Three.js (`1`, `0`, `#000000`). Older scenes revive with those defaults.
- [x] **Material key.** `ResourceCache` and `InstancePool` key by the full spec so two cubes with different roughness do not share a GPU material or instanced batch.
- [x] **Inspector Mesh.** Dumb roughness / metalness inputs and an emissive picker; `useInspectorMesh` writes the selected entity.

### Albedo textures
- [x] **`Mesh.albedo`.** Optional texture URL on `MeshData`. Empty string means untextured. Older scenes revive with `albedo: ''`.
- [x] **Pooled maps.** `ResourceCache` keys materials by `(color, albedo)` and refcounts textures so two colors sharing a URL share one GPU texture.
- [x] **Instancing.** `InstancePool` batches by `(primitive, color, albedo)` so a texture edit moves the entity between batches and releases the previous material.
- [x] **Inspector Mesh.** Dumb albedo URL field; the smart Inspector writes `Mesh.albedo` and persists on commit.

### Lights
- [x] **`Light` component.** `defineComponent('light')` with `kind` (`directional` | `point` | `ambient`), `color`, `intensity`, and point-only `distance`.
- [x] **`LightPool`.** Creates, syncs and removes Three.js lights from ECS data each frame. Directional lights aim along the entity `-Z`. Point lights take world position. Ambient lights ignore the transform.
- [x] **Fallback lighting.** The renderer keeps the previous directional + ambient pair visible only while no `Light` entities exist, so older scenes stay lit.
- [x] **Inspector Light.** Dumb `InspectorLight` section (kind, color, intensity, distance, remove) plus an Add Light button on the selection.
- [x] **Hierarchy spawn.** The `+` menu creates Directional / Point / Ambient light entities.

### Contact events / triggers
- [x] **`Sensor` component.** `defineComponent('sensor')` with an optional `tag` string. Pairing it with `RigidBody` marks the Rapier collider as `sensor: true` with `COLLISION_EVENTS` enabled.
- [x] **`asSensorDesc` collider helper.** Wraps any `ColliderDesc` with `setSensor(true).setActiveEvents(...)` so the sync system applies the flag without duplicating shape logic.
- [x] **Intersection tracking in `PhysicsSession`.** `eventQueue` (a single `RAPIER.EventQueue`) is stepped with the world each tick. `drainCollisionEvents` updates a `Map<Entity, Set<Entity>>` (`started=true` adds, `started=false` removes) so persistent overlaps are always visible.
- [x] **`getIntersections(session, entity)`.** Public query returning the live set of entities currently overlapping a sensor.
- [x] **`createTriggerSystem`.** Stateful system factory: compares current overlaps against the previous tick to fire `onEnter` / `onExit` exactly once per transition.
- [x] **Demo kill-zone.** `seedDropScene` now spawns a large fixed `Sensor` box well below the slab. `useGame` wires `createTriggerSystem` to it instead of the Y-threshold `createLoseSystem`.

### Character feel
- [x] **Locked rotations.** `createPhysicsPlayerControlSystem` locks Rapier rotations and zeros angular velocity so a sphere does not roll.
- [x] **Grounded raycast.** A downward ray from the body, excluding itself, decides whether Space may jump.
- [x] **Jump.** Space sets upward linvel only while grounded. Air Space is ignored.

### Author → Play
- [x] **`createPrimitive` scale and rotation.** Spawn options include `scale` and `rotation`. The demo no longer mutates Transform by hand.
- [x] **`engine.ready` / `start()` waits for Rapier.** The constructor still starts the WASM load; `await engine.start()` is the one boot seam. Hosts no longer call `initPhysics()` themselves.
- [x] **`RigidBody` in the Inspector.** Add / remove, kind `dynamic` | `fixed`. A Control checkbox tags `PlayerControlled` so an editor-authored body can be driven by WASD. The editor also registers `createPhysicsPlayerControlSystem()`.
- [x] **Demo loads `public/drop.titane`.** `engine.loadWorld(deserializeWorld(...))` on boot; `seedDropScene` remains the fallback if the file is missing.

### Game demo
- [x] **Renderer game mode.** `new ThreeRenderer({ mode: 'game' })` skips orbit, gizmos and the grid. `setCamera({ position, lookAt })` aims the perspective camera. Default remains `editor`, so the existing viewport is unchanged.
- [x] **Physics-aware player.** Opt-in `createPhysicsPlayerControlSystem()` writes Rapier `linvel.x/z` from WASD and leaves `linvel.y` to gravity. The kinematic `createPlayerControlSystem()` is unchanged.
- [x] **`apps/demo`.** A Nuxt 4 Drop loop: fixed slab, dynamic player sphere, a few crates, follow camera, fall-off lose, snapshot restart. No Hierarchy / Inspector.

### Simulation
- [x] **Rapier in the PHYSICS phase.** `@dimforge/rapier3d-compat` (inlined WASM) drives entities with a `RigidBody` (`dynamic` or `fixed`). Collider shape comes from `Mesh.primitive` and `Transform.scale`. The demo cube keeps `Velocity` only, so it still slides and does not fall. Bodies with `Velocity` and no `RigidBody` still use the kinematic integrator.
- [x] **Fixed timestep.** While playing, UPDATE and PHYSICS run at 1/60 s with a capped accumulator. INPUT, POST_PHYSICS and RENDER keep the frame delta. A paused tick still runs the full pipeline so gizmos and hierarchy stay live.
- [x] **Proper single-step.** `engine.step()` advances one fixed step without unpausing. The toolbar Step button calls it directly (no 16 ms `setTimeout`).

### Storage & Scale
- [x] **SoA storage for hot components.** `Transform` and `Velocity` live in packed typed arrays behind the existing accessors. `ComponentType.createStore` is the seam: other components still use a sparse map. `addComponent` keeps object identity by binding the caller's object to the buffers, so the transform system, Inspector and tests do not change. Recycled IDs detach stale views so they cannot write the new occupant.
- [x] **Query cache.** `runQuery` reuses its result buffer while `World._generation` is unchanged. Membership changes (`addComponent`, `removeComponent`, `destroyEntity`, `cloneEntity`, `restoreWorldState`) bump the generation; in-place field edits do not.
- [x] **Instanced rendering.** Entities that share a primitive and color draw as one `InstancedMesh`. Color or primitive edits move the instance between batches. Picking maps `instanceId` back to the entity. The gizmo attaches to a proxy `Object3D` because instances have no per-entity mesh.

### Editor Performance
- [x] **O(n) hierarchy rebuild.** `useHierarchy` used to re-filter the full entity list at every depth (`buildHierarchyLevels`). A parent-to-children index is now built once per recomputation (`indexByParent` / `buildIndexedForest`), so a deep chain is linear. Orphans (dead parent) still lift to the root so the tree, the count badge and the viewport stay in agreement.
- [x] **Dirty-flag auto-save.** The entity `Set` watcher still persists structural changes immediately. In-place component edits (Inspector axes, primitive, color, gizmo drags) set a dirty flag; the 60s timer serializes only when that flag is set, so an idle editor no longer rewrites local storage every minute. Blur / popover-close / gizmo-click still commit immediately.

### Reach the New Rendering Features
- [x] **Primitive choice on create.** The Hierarchy "+" opens a dropdown (Box / Sphere / Plane) instead of hardcoding `primitive: 'box'`. The new entity is still parented under the current selection when there is one.
- [x] **Primitive selector in the Inspector.** A dumb `InspectorMesh` section writes `Mesh.primitive` through `updateComponent` via a button group (same pattern as the gizmo toolbar). The renderer already swapped geometries on mismatch; the tool can now produce a sphere or a plane.
- [x] **Color picker in the Inspector.** A Nuxt UI color picker writes `Mesh.color` live; persistence waits until the popover closes so a drag does not flood autosave.
- [x] **Bounded material pool.** `ResourceCache` refcounts materials and disposes a color when its last user drops it. A picker dragged through thousands of values can no longer grow the pool without bound.

### Viewport Interaction
- [x] **Click to select.** `ThreeRenderer.pick` raycasts only mapped meshes, so the grid and gizmo handles never resolve as a hit. A miss clears the selection. Clicks that start on a handle are consumed and do not change the selection.
- [x] **Orbit camera.** Middle-drag orbits, right-drag pans, the wheel zooms. The left button is left free for picking, so camera and selection do not fight.
- [x] **Transform gizmos.** Translate / rotate / scale handles (W / E / R, or the toolbar) write local TRS back into the ECS. Parented entities convert the gizmo's world pose through `worldMatrixToLocalTrs`. Handles hide while the simulation is playing.
- [x] **Reset scene.** An edit baseline is captured after load or after seeding the demo cube, independent of the play snapshot. Reset restores that baseline without reloading the page.

### Renderer Extraction
- [x] **`packages/renderer` exists.** The Three.js driver moved out of `packages/core/src/rendering/`, and `three` is no longer a dependency of the core. The "renderer agnostic core" claim is now enforced by the package boundary rather than by convention.
- [x] **`MeshData.primitive` is honoured.** The driver always built a `BoxGeometry`, so a sphere or a plane rendered as a box. The mapping is an exhaustive switch, so adding a primitive type breaks the build instead of silently drawing the wrong shape.
- [x] **Every primitive fits the same unit box**, so `Transform.scale` means the same thing whatever the shape.
- [x] **Material changes are picked up.** `MeshData.color` was only read when the object was first created, so an edit never reached the screen.
- [x] **Geometries and materials are pooled** by `ResourceCache` instead of allocating a pair per entity. An entity now costs one `Object3D`, disposal happens once at shutdown, and entities sharing a shape and color already share the objects instancing would need to batch.
- [x] **`setGridVisible` left `IRenderer`.** Editor chrome no longer pollutes the engine's rendering contract; the editor reaches it through the driver it constructed.
- [x] **The renderer has its own test suite**, covering the primitive mapping, the unit-box invariant, resource sharing and disposal.

### Scene Loading Integrity
Two more defects of the "phantom duplicate" family, found while smoke-testing the extraction.

- [x] **The input singleton's ID is re-reserved after a load.** A loaded scene brings its own `nextId` and free list, both of which could consider that ID available. The next created entity was handed the same ID and overwrote the engine's input entity, so it rendered in the viewport while vanishing from any UI that filters engine-owned entities out.
- [x] **The editor's initial scene is persisted at creation.** The demo cube was seeded *after* the autosave watcher was registered and never synced, so it stayed invisible to persistence until the 60-second timer fired. Any reload before that re-created it, and the scene accumulated duplicate cubes.

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

Source of truth: `docs/ROADMAP.md`. A phase is done when its user scenario passes, not when its checklist is ticked. **No rendering or physics PRs between Phase 0 and Phase 4.**

### Phase 0 — Close the visual floor — done

Mesh material (#14) and shadows (#16) are on `release`. Rendering is frozen.

### Phase 1 — Code ↔ ECS ↔ Inspector — done

`.titane` stays data-only. Behavior lives in user `.ts`. Schema is the single source of truth. `engine.use` + `engine.registerComponent` expose types to Add Component. Auto Inspector writes values through the existing dirty-flag / commit path.

**Done when:** write `PlayerController.ts` with `speed` → it appears in Add Component → slider → save → reload → value still there.

### Phase 2 — Iteration loop — done

Play-in-place in the editor viewport. Snapshot on Play with explicit keep/discard. HMR of scripts during Play. `onUpdate` errors must not kill the editor.

**Done when:** change `speed` in the `.ts` file and the running Play session picks it up without a full reload.

### Phase 3 — Distributable product — done in this branch

Project convention, `npm run create`, editor on `/titane` in dev, prod build omits the layer, docs under `docs/`.

**Done when:** scaffold → `npm run dev` → moving cube + editor + custom component, under five minutes.

### Phase 4 — Unfreeze

glTF animation, physics material, asset manager, File System Access, prefabs.

### Still parked

No Camera component in core yet. Demo stays a sandbox. Do not grow it.
