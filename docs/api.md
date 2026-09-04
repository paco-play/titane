# API reference

Public entry points. Types travel with the handles; there is no `any` in the engine API.

## `@titane/core`

| Name | Role |
| --- | --- |
| `TitaneEngine` | World, scheduler, play/pause/step, `loadWorld`, snapshots |
| `engine.use` / `applyTitaneConfig` | Register plugins from `titane.config.ts` |
| `engine.registerComponent` | User type → Add Component + batched lifecycle |
| `engine.getUserComponents` | Types listed in the Inspector |
| `defineComponent` | Built-in factory form, or `{ schema, onStart, onUpdate, onDestroy }` |
| `f.*` | Schema DSL (`number`, `boolean`, `string`, `color`, `vec3`, `quat`, `enum`, `entity`) |
| `createPrimitive` | Entity with `Name` + `Transform` + `Mesh` |
| `getComponent` / `addComponent` / `removeComponent` | Typed accessors |
| `defineQuery` / `runQuery` | Zero-allocation iteration |
| `Phase` / `engine.addSystem` | Pipeline registration |
| `serializeWorld` / `deserializeWorld` | `.titane` JSON |
| `TitanePlugin` / `TitaneConfig` | Host seam |

Built-in components include `Transform`, `Mesh`, `Name`, `Velocity`, `Light`, `Gltf` (`url`, `clip`, `playing`, `loop`), `Sound`, `RigidBody` (`kind`, `friction`, `restitution`), `Sensor`, `PlayerControlled`, `Input`.

## `@titane/renderer`

| Name | Role |
| --- | --- |
| `ThreeRenderer` | `IRenderer` driver. `{ mode: 'game' }` skips orbit, gizmos, grid |
| `setCamera` | Look-from / look-at for game hosts |
| `setEditorChromeEnabled` | Play-in-place hides editor chrome |

## Editor (dev)

Nuxt layer `@titane/editor`. Route `/titane`. Host `titane.config.ts` is imported as `~~/titane.config`. Production configs must not extend the layer.
