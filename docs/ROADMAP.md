# Titane product loop

This file is the source of truth for **what Titane is becoming** and **what is in scope**.
`PROJECT_STATUS.md` lists what already shipped.

Titane already has a solid engine floor: typed data-oriented ECS, a decoupled Three.js renderer, a working editor (hierarchy, inspector, gizmos, play/pause/step), Rapier, glTF, audio, and `.titane` serialization.

That floor is not the product. The product is this loop:

> I write TypeScript → I attach a behavior to an entity → the editor exposes my fields → I press Play → it runs → I iterate.

Until that loop exists, more rendering features make a better scene viewer, not a game engine.

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

Recommended shape: a small house DSL (`f.number`, `f.color`, `f.entity`, …) with editor metadata (`min`, `max`, `step`). Not Zod (weak editor metadata). Not decorators (bundler friction).

### Execution stays data-oriented

`onStart` / `onUpdate` / `onDestroy` are the ergonomic API. Internally they run as **one batched system per component type**, not as scattered per-entity calls.

### Phase gates

Each phase is done when its **user scenario** passes, not when its task list is checked.

**No rendering or physics features between Phase 0 and Phase 4.** Easy visual PRs are out of scope even when they look cheap. Frozen until Phase 4: glTF animation, physics material, asset manager, extra demo work.

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
| 1.3 | Schema DSL `f.*` | **Done.** `number`, `boolean`, `string`, `color`, `vec3`, `quat`, `enum`, `entity`. TS inference. Defaults. Deserialize validation. |
| 1.4 | User `defineComponent` + lifecycle | **Done.** `onStart` / `onUpdate` / `onDestroy`. Batched system per type. |
| 1.5 | Auto Inspector | **Done.** Schema → widget. Writes use the existing dirty flag + commit (no separate undo stack in the editor yet). |
| 1.6 | Add / remove component | **Done.** Inspector lists `engine.getUserComponents()` (Unity-style Add Component). |

Widget map:

| Schema | Widget |
| --- | --- |
| `f.number({ min, max, step })` | Slider + numeric input |
| `f.number()` | Drag-input (Shift = fine, Ctrl = coarse) |
| `f.boolean()` | Toggle |
| `f.color()` | Color picker |
| `f.vec3()` | Three drag-inputs |
| `f.entity()` | Entity reference + hierarchy pick |
| `f.enum([...])` | Select |
| `f.asset(...)` | URL + picker from `public/assets` |

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

1. glTF animation (`clip`, `playing`, `loop`) — **Done.**
2. Physics material (friction, restitution) — **Done.**
3. Asset manager (`f.asset()` in the Inspector) — **Done.**
4. Ctrl+S writes `scenes/main.titane` — **Done.** Dev Nitro `PUT /api/titane/scene`. Not the browser File System Access API.
5. Prefabs (entity + children + components, reusable) — **Done.**

---

## Phase 5 — Scene camera

Play-in-place made `setCamera` feel wrong: Play still looked through the orbit camera.

1. `Camera` component (`fov`, `near`, `far`, `current`) — **Done.** Play and game mode look through the current camera. Edit mode keeps orbit. Exit Play restores the editor pose. Hierarchy `+` spawns one at `(0, 2, 6)`.

---

## Project panel

The Inspector `f.asset()` picker is not a Project window. The editor now has a bottom **Project** panel: Scenes, Prefabs, Models, Textures, Audio. Files come from `scenes/`, `public/prefabs`, and `public/assets`. Double-click a prefab / model / sound to spawn it; a texture writes `Mesh.albedo` on the selection.

---

## Already on the floor (do not rebuild)

- ECS kernel, phases, SoA stores, queries, public `addSystem` / `removeSystem`
- Editor: hierarchy, inspector, gizmos, pick, orbit, play/pause/step, dirty-flag save, Project panel
- Renderer: instancing, lights, albedo, PBR material, shadows, glTF, audio, scene camera
- Rapier + sensors/triggers
- Play snapshot with explicit Keep / Discard
- Demo as a sandbox only — do not grow it
