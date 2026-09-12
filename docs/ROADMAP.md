# Titane product loop

This file is the source of truth for **what Titane is becoming** and **what is in scope**.
Phases **0–9** below are historical: they shipped. Phases **10+** are what comes next.

Titane already has a solid engine floor: typed data-oriented ECS, a decoupled Three.js renderer, a working editor (hierarchy, inspector, gizmos, play/pause/step), Rapier, glTF, audio, and `.titane` serialization.

The product is this loop:

> I write TypeScript → I attach a behavior to an entity → the editor exposes my fields → I press Play → it runs → I iterate.

That loop exists. What follows is authoring polish and tooling (undo, Project window, data assets, MCP, observability), not a new engine. More rendering features still do not replace a missing authoring or agent workflow.

---

## Non-negotiable contract

### `.titane` is data only

A `.titane` file stores entities, component values, hierarchy, and references. It never stores behavior: no callbacks, no script bodies, no generated code.

Behavior lives in the user's `.ts` files, versioned by git, edited in a normal TS toolchain. The editor never generates code. It reads schemas and writes values.

Scripts are referenced by a **stable registry id**, not a file path:

```json
{
  "type": "PlayerController",
  "data": { "speed": 5.2, "jumpHeight": 3, "target": { "entityRef": 42 } }
}
```

The project code populates the registry at boot via `engine.use`. If a script is missing, the editor shows a **missing component** and **keeps the data** (Unity's missing-script behavior).

### Schema is the single source of truth

A user component declares a schema. That schema must simultaneously:

- infer the TypeScript data type (no parallel `interface` to maintain)
- drive Inspector widgets
- validate on deserialize
- supply defaults

If the developer has to write a type **and** a schema, the design has failed.

Recommended shape: a small house DSL (`field.number`, `field.color`, `field.entity`, …) with editor metadata (`min`, `max`, `step`). Not Zod (weak editor metadata). Not decorators (bundler friction).

### Execution stays data-oriented

`onStart` / `onUpdate` / `onDestroy` are the ergonomic API. Internally they run as **one batched system per component type**, not as scattered per-entity calls.

### Phase gates

Each phase is done when its **user scenario** passes, not when its task list is checked.

**No rendering or physics features between Phase 0 and Phase 4.** Easy visual PRs are out of scope even when they look cheap. Frozen until Phase 4: glTF animation, physics material, asset manager.

Play / game mode uses an ECS `Camera` when one is flagged `current`. `ThreeRenderer.setCamera` remains the host override when none is.

---

## Phase 0 — Close the visual floor

Short. Do not expand.

| # | Task | Status |
| --- | --- | --- |
| 0.1 | Merge mesh material (PR #14): `roughness`, `metalness`, `emissive` | Done |
| 0.2 | Shadows: `Light.castShadow`, `Mesh.castShadow` / `Mesh.receiveShadow` | Done |

After 0.2, **stop rendering** until Phase 4. Shadows are the last render feature that changes whether a scene is readable.

---

## Phase 1 — Code ↔ ECS ↔ Inspector

This is the phase that changes the nature of the product.

| # | Task | Detail |
| --- | --- | --- |
| 1.1 | Data-only `.titane` | **Done.** Unknown ids stay as orphan payloads; Inspector shows a missing-script row. |
| 1.2 | `engine.use(plugin)` | **Done.** `{ name, register(engine) }`. Duplicate names throw. Systems and components register through the public API. |
| 1.3 | Schema DSL `field.*` | **Done.** `number`, `boolean`, `string`, `color`, `vec3`, `quat`, `enum`, `entity`. TS inference. Defaults. Deserialize validation. |
| 1.4 | User `defineComponent` + lifecycle | **Done.** `onStart` / `onUpdate` / `onDestroy`. Batched system per type. |
| 1.5 | Auto Inspector | **Done.** Schema → widget. Writes use the existing dirty flag + commit (no separate undo stack in the editor yet). |
| 1.6 | Add / remove component | **Done.** Inspector lists `engine.getUserComponents()` (Unity-style Add Component). |

Widget map:

| Schema | Widget |
| --- | --- |
| `field.number({ min, max, step })` | Slider + numeric input |
| `field.number()` | Drag-input (Shift = fine, Ctrl = coarse) |
| `field.boolean()` | Toggle |
| `field.color()` | Color picker |
| `field.vec3()` | Three drag-inputs |
| `field.entity()` | Entity reference + hierarchy pick |
| `field.enum([...])` | Select |
| `field.asset(...)` | URL + picker from `public/assets` |

Play-mode edits: Titane must offer an explicit **keep / discard** on exiting Play. Unity loses Play edits by default; do not copy that.

**Done when:** a developer writes `PlayerController.ts` with a `speed` field, never touches editor source, sees it under Add Component, attaches it, edits `speed` with a slider, saves, reloads, and the value is still there.

---

## Phase 2 — Iteration loop

Without this, the triangle exists but is slow to use.

| # | Task | Detail |
| --- | --- | --- |
| 2.1 | Play-in-place | **Done.** Viewport drops orbit / gizmos / grid while Playing. Demo is no longer required to try a scene. |
| 2.2 | Snapshot around Play | **Done.** Enter Play = snapshot. Exit asks **Keep** / **Discard**. Discard restores; Keep leaves Play edits as the edit scene. |
| 2.3 | Hot-reload scripts in Play | **Done.** `defineComponent` patches the interned type; `engine.reloadUserComponent` rebakes live data. Vite `import.meta.hot.accept` in the editor. |
| 2.4 | Runtime errors in the editor | **Done.** `onUpdate` throws are isolated per entity and shown in a banner. The editor keeps ticking. |

**Done when:** the developer changes `speed` in the `.ts` file, saves, and the running Play session picks it up without a full page reload.

---

## Phase 3 — Distributable product

This is when someone else can use Titane.

| # | Task | Detail |
| --- | --- | --- |
| 3.1 | Project convention | **Done.** `scenes/`, `src/components/`, `public/assets/`, `titane.config.ts`. |
| 3.2 | `npm create titane-project` | **Done.** Interactive scaffold: `nuxt` (editor in dev) and `vanilla` (Vite). TS default, moving cube. Next / SvelteKit are not faked. |
| 3.3 | Embedded editor in dev | **Done.** Editor on `/titane` via the `@titane/editor` Nuxt layer. Not a second app. |
| 3.4 | Production build | **Done.** Generated `nuxt.config` omits the layer when `NODE_ENV === 'production'`. |
| 3.5 | Docs | **Done.** [Getting started](./getting-started.md), [ECS](./ecs.md), [writing a component](./writing-a-component.md), [API](./api.md). |

**Done when:** `npm create titane-project` → three questions → `npm run dev` → a cube moves, the editor is reachable, a custom component can be added. Under five minutes, without reading docs.

---

## Phase 4 — Unfreeze engine features

Only after the product loop exists.

1. glTF animation (`clip`, `playing`, `loop`, `fade`) — **Done.**
2. Physics material (friction, restitution) — **Done.**
3. Asset manager (`field.asset()` in the Inspector) — **Done.**
4. Ctrl+S writes `scenes/main.titane` — **Done.** Dev Nitro `PUT /api/titane/scene`. Not the browser File System Access API.
5. Prefabs (entity + children + components, reusable) — **Done.**

---

## Phase 5 — Scene camera

Play-in-place made `setCamera` feel wrong: Play still looked through the orbit camera.

1. `Camera` component (`fov`, `near`, `far`, `current`) — **Done.** Play and game mode look through the current camera. Edit mode keeps orbit. Exit Play restores the editor pose. Hierarchy `+` spawns one at `(0, 2, 6)`.

---

## Phase 6 — Authoring truth

The viewport must show colliders, sky, and the host project.

| # | Task | Detail |
| --- | --- | --- |
| 6.1 | Collider overlay | **Done.** Wireframe box / sphere / capsule / mesh (bounds) in edit. Selection + toggle “show all”. Hidden in Play. Follows `Collider` (independent of `Mesh`). |
| 6.2 | Engine skybox | **Done.** Engine default cubemap (`public/engine`, not Project textures). Serialized `Skybox` (`color` + `cubemap`). Play and game mode. Replacing that default is 6.4, not a mesh component. |
| 6.3 | Host scene + plugins | **Done.** `/scenes/main.titane` is the project file (cwd, not the layer sample). Host `titane.config.ts` registers in the embedded editor. Hierarchy `syncWorld` after runtime spawn. Autosave cannot hide a valid project scene. |
| 6.4 | World inspector | **Done.** Hierarchy **World** row inspects the scene Skybox (`ensureSkybox` Transform-less entity, hidden from the tree). Inspector stays closed until a row is selected. Reset restores the engine cubemap. Not parked on a Cube. |

**Done when:** a `Collider` is visible in the viewport, empty selection authors the world skybox and it survives save/reload, `/titane` opens the project scene and plugins.

---

## Phase 7 — Camera and input

| # | Task | Detail |
| --- | --- | --- |
| 7.1 | Orthographic camera | **Done.** `Camera.projection` perspective \| orthographic + `orthoSize`. Play / game. Edit orbit stays perspective. |
| 7.2 | Pick on `IRenderer` | **Done.** `pick` + `worldPointFromPointer` on the interface. Game hosts use `engine.renderer`. |
| 7.3 | Mouse `justPressed` | **Done.** Same one-frame impulse as keyboard. Held `buttons` stay. |

**Done when:** a current ortho camera is used in Play; a game host clicks through `engine.renderer` without casting `ThreeRenderer`; a mouse click is a one-frame impulse.

---

## Phase 8 — VFX

| # | Task | Detail |
| --- | --- | --- |
| 8.1 | `Vfx` component | Burst / loop, lifetime, rate, color, size, `field.asset()` texture. Data in `.titane`. **Done.** |
| 8.2 | Renderer pool | CPU quads. Not one Entity per particle. **Done.** |

**Done when:** Add Component `Vfx` → Play → particles → save/reload → same asset and params.

World post filters (`PostFx`: bloom / exposure / contrast / saturation / tint / vignette) ship with this phase. Authored from the Hierarchy **World** row, same Transform-less pattern as Skybox.

---

## Phase 9 — Pathfinding

| # | Task | Detail |
| --- | --- | --- |
| 9.1 | Nav data | Bake from walkable colliders (grid or simple navmesh). Optional debug draw (same family as 6.1). **Done.** |
| 9.2 | `Agent` | Destination, speed. System moves `Transform` (and the Rapier body when present). Mobs and objects. **Done.** |

**Done when:** an Agent walks A → B around baked colliders in Play, with no ad-hoc grid in game code.

Authored paths (waypoints / spline drawn in the editor, loops for ambient movers) are not this phase. They stay in Later.

---

## Phase 10 — Daily authoring

Cheap, immediate, unblocks humans and agents. Inspector rotations in degrees, edit-mode undo, and scene fog.

| # | Task | Detail |
| --- | --- | --- |
| 10.1 | Inspector rotation in degrees | Transform Euler XYZ **display and type** in degrees. ECS storage stays radians. Gizmos unchanged. |
| 10.2 | Edit undo / redo | Command stack for Inspector writes, gizmos, spawn / delete / reparent. Ctrl+Z / Ctrl+Y. Play Keep / Discard stays a snapshot, not this stack. |
| 10.3 | Fog | World-authored fog + fade distance (same Transform-less family as Skybox / PostFx). `Camera.far` remains the hard clip. |

**Done when:** typing `90` in Rotation is 90°; Ctrl+Z undoes a gizmo move; fog is not “set Camera.far lower”.

---

## Phase 11 — Real Project window

Models already list `.gltf` / `.glb` under `public/assets`. This phase is preview and folders, not a second inventory. Not an OS explorer, not Addressables.

| # | Task | Detail |
| --- | --- | --- |
| 11.1 | Model preview | Tiles show a thumbnail / 3D peek, not only a generic box icon. |
| 11.2 | Folders | Create folders, rename, move files between folders. Internal drag. No OS-drop import pipeline in this phase. |

**Done when:** you create `public/assets/props/`, move a `.glb` into it, rename it, and the tile is not a generic icon.

---

## Phase 12 — Data assets

Unity ScriptableObject analog. Reuse the `field.*` DSL. Files of data, not entities. `.titane` stays data-only.

| # | Task | Detail |
| --- | --- | --- |
| 12.1 | Define a data type | House schema (same `field.*`) registered like a component, stored as a project file, not an ECS entity. |
| 12.2 | Inspector ref | A field kind (name TBD, e.g. `field.data('LootTable')`) assigns that asset on a component. Save / reload keeps the ref. |

**Done when:** you define `LootTable`, assign the asset on a component, save, reload, and the ref is still there.

PBR materials-as-files can ride this later. Not a dedicated phase now (`Mesh` already holds roughness / metalness / albedo).

---

## Phase 13 — Engine MCP

Stable tools on **core + Nitro**, not DOM scraping: read / write the scene, hierarchy, Add Component, Play, schemas. Comes after undo and degrees so agents do not encode the wrong widgets.

| # | Task | Detail |
| --- | --- | --- |
| 13.1 | Scene tools | List entities, inspect components, spawn, attach a registered user component, set fields. |
| 13.2 | Play tools | Enter / exit Play (Keep / Discard). Surface isolated script errors. |
| 13.3 | Schema tools | List `engine.getUserComponents()` and field metadata so an agent can fill Inspector-legal values. |

**Done when:** a Cursor agent creates an entity, attaches a user component, and presses Play without clicking the editor UI.

---

## Phase 14 — Observability

Engine log + a perf tab. Useful once VFX, nav, and glTF weigh on a scene. Not a Unity Profiler clone.

| # | Task | Detail |
| --- | --- | --- |
| 14.1 | Engine terminal | Engine / script / bake logs in the editor. Not the Nuxt DevTools console. |
| 14.2 | Perf tab | FPS, draw calls, entity count, query cost. Enough to see why Play hitchs. |

**Done when:** a heavy VFX scene shows FPS and particle / entity counts next to a scrollable engine log.

---

## Later

Not numbered. Do not pull these forward to look busy.

- **Authored paths** — waypoints or a spline drawn in the editor, loop playback. Ambient movers (birds left → right), not nav-bake A → B.
- **Copy / duplicate / multi-select** — daily authoring. Slide into Phase 10 only if undo work already touches selection; otherwise stay here.
- **Prefab overrides** — instance vs prefab asset. The Unity hole that appears as soon as prefabs are reused.
- **Game UI runtime, then an editor view** — there is no HUD runtime today (no uGUI, CSS2D, or ECS canvas). An editor view without a runtime is theatre.
- **Illustrated Nuxt Content API site** — the four markdown pages exist. Screenshot docs rot on every Inspector change. After MCP, when the UI has calmed down.
- **Project listing of registered components** — discoverability only. **Not** a second attach path. `defineComponent` + Add Component is already Unity-like attachable scripts.

---

## Do not build

These contradict the contract or rebuild what shipped.

- **In-engine code editor** (Monaco, autocomplete, in-app docs). Behavior lives in the user's `.ts` files, versioned by git, edited in a normal TS toolchain. The editor never generates code. An agent talks to the engine through MCP, not through an embedded IDE.
- **A second script system** “like Unity” (drag `.ts` onto entities as MonoBehaviours). Registry id + Add Component + missing-script orphans already are that product.
- **Addressables / kitchen-sink asset manager** — folders and rename are Phase 11. Import pipelines, OS dump, and material databases are out.

---

## Project panel

The Inspector `field.asset()` picker is not a Project window. The editor now has a bottom **Project** panel: Scenes, Prefabs, Models, Textures, Audio. Files come from `scenes/`, `public/prefabs`, and `public/assets`. Engine defaults (the sky cubemap) live under `public/engine` and are not listed. Double-click a prefab / model / sound to spawn it; a texture writes `Mesh.albedo` on the selection. Drag a tile onto the viewport to place it at the pointer. `Collider` (box / sphere / capsule / mesh) is authored in the Inspector, independent of `Mesh`. Models already list `.gltf` / `.glb`; Phase 11 is preview and folders.

---

## Already on the floor (do not rebuild)

- ECS kernel, phases, SoA stores, queries, public `addSystem` / `removeSystem`
- User `defineComponent` + `field.*` + Inspector Add Component + missing-script orphans
- Editor: hierarchy, inspector, gizmos, pick, orbit, play/pause/step, dirty-flag save, Project panel
- Renderer: instancing, lights, albedo, PBR material, shadows, glTF, audio, scene camera, `Camera.far`
- Rapier + sensors/triggers + authored `Collider`
- Play snapshot with explicit Keep / Discard
