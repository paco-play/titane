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

The project code populates the registry at boot via `engine.use`. If a script is missing, the editor shows a **missing component** and **keeps the data** (Unity's missing-script behavior). Today's loader skips unknown ids with a warning — Phase 1.1 must stop dropping that data.

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

**No rendering or physics features between Phase 0 and Phase 4.** Easy visual PRs are out of scope even when they look cheap. Frozen until Phase 4: glTF animation, physics material, asset manager, File System Access, extra demo work.

No Camera component in core until play-in-place makes `ThreeRenderer.setCamera` feel wrong.

---

## Phase 0 — Close the visual floor

Short. Do not expand.

| # | Task | Status |
| --- | --- | --- |
| 0.1 | Merge mesh material (PR #14): `roughness`, `metalness`, `emissive` | Open draft → mark ready |
| 0.2 | Shadows: `Light.castShadow`, `Mesh.castShadow` / `Mesh.receiveShadow` | Next |

After 0.2, **stop rendering** until Phase 4. Shadows are the last render feature that changes whether a scene is readable.

---

## Phase 1 — Code ↔ ECS ↔ Inspector

This is the phase that changes the nature of the product.

| # | Task | Detail |
| --- | --- | --- |
| 1.1 | Data-only `.titane` | Documented here. Add registry `type` + keep unknown component payloads. |
| 1.2 | `engine.use(plugin)` | Plugin registers components, systems, and custom Inspector field types. Prerequisite to 1.3–1.6, not a side feature. |
| 1.3 | Schema DSL `f.*` | `number`, `boolean`, `string`, `color`, `vec3`, `quat`, `enum`, `entity`. TS inference. Defaults. Deserialize validation. |
| 1.4 | User `defineComponent` + lifecycle | `onStart` / `onUpdate` / `onDestroy`. Batched system per type. |
| 1.5 | Auto Inspector | Schema → widget. Undo/redo on inspector writes, wired to the existing dirty flag. |
| 1.6 | Add / remove component | Inspector lists registered types (Unity-style Add Component). |

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
| `f.asset(...)` | Phase 4 |

Play-mode edits: Titane must offer an explicit **keep / discard** on exiting Play. Unity loses Play edits by default; do not copy that.

**Done when:** a developer writes `PlayerController.ts` with a `speed` field, never touches editor source, sees it under Add Component, attaches it, edits `speed` with a slider, saves, reloads, and the value is still there.

---

## Phase 2 — Iteration loop

Without this, the triangle exists but is slow to use.

| # | Task | Detail |
| --- | --- | --- |
| 2.1 | Play-in-place | Viewport switches to game-mode renderer. Demo is no longer required to try a scene. |
| 2.2 | Snapshot around Play | Enter Play = snapshot. Exit = restore, with **keep Play changes** as an explicit choice. Snapshot-on-play already exists; keep/discard does not. |
| 2.3 | Hot-reload scripts in Play | Vite HMR. Re-register the component, re-bind behaviors, keep data. Approximate is fine at first. |
| 2.4 | Runtime errors in the editor | An exception in `onUpdate` must not kill the editor. Isolate and display. |

**Done when:** the developer changes `speed` in the `.ts` file, saves, and the running Play session picks it up without a full page reload.

---

## Phase 3 — Distributable product

This is when someone else can use Titane.

| # | Task | Detail |
| --- | --- | --- |
| 3.1 | Project convention | `scenes/`, `src/components/`, `public/assets/`, `titane.config.ts`. Few options. |
| 3.2 | `npm create titane-project` | Interactive scaffold: Vite vanilla / Nuxt / Next / SvelteKit, TS default, minimal playable example. |
| 3.3 | Embedded editor in dev | Editor on a project route (e.g. `/titane`) in dev only. Not a second app to launch. |
| 3.4 | Production build | Strips the editor. Bundle is core + renderer + scene + scripts. |
| 3.5 | Docs | Getting started (5 minutes), ECS concepts, writing a component, API reference. Docs wait until the plugin seam exists. |

**Done when:** `npm create titane-project` → three questions → `npm run dev` → a cube moves, the editor is reachable, a custom component can be added. Under five minutes, without reading docs.

---

## Phase 4 — Unfreeze engine features

Only after the product loop exists.

1. glTF animation (`clip`, `playing`, `loop`)
2. Physics material (friction, restitution)
3. Asset manager (`f.asset()` in the Inspector)
4. File System Access (Ctrl+S to disk)
5. Prefabs (entity + children + components, reusable)

---

## Already on the floor (do not rebuild)

- ECS kernel, phases, SoA stores, queries, public `addSystem` / `removeSystem`
- Editor: hierarchy, inspector, gizmos, pick, orbit, play/pause/step, dirty-flag save
- Renderer: instancing, lights, albedo, glTF, audio (mesh PBR on PR #14)
- Rapier + sensors/triggers
- Play snapshot restore (always discards Play edits today)
- Demo as a sandbox only — do not grow it
