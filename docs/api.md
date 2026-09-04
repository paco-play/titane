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
| `f.*` | Schema DSL (`number`, `boolean`, `string`, `color`, `vec3`, `quat`, `enum`, `entity`, `asset`) |
| `createPrimitive` | Entity with `Name` + `Transform` + `Mesh` |
| `getComponent` / `addComponent` / `removeComponent` | Typed accessors |
| `defineQuery` / `runQuery` | Zero-allocation iteration |
| `Phase` / `engine.addSystem` | Pipeline registration |
| `serializeWorld` / `deserializeWorld` / `isSerializedWorld` | `.titane` JSON scenes |
| `serializePrefab` / `instantiatePrefab` | Subtree templates (`public/prefabs`) |
| `TitanePlugin` / `TitaneConfig` | Host seam |

Built-in components include `Transform`, `Mesh`, `Name`, `Velocity`, `Light`, `Gltf` (`url`, `clip`, `playing`, `loop`), `Sound`, `Camera` (`fov`, `near`, `far`, `current`), `RigidBody` (`kind`, `friction`, `restitution`), `Sensor`, `PlayerControlled`, `Input`. `pickCurrentCamera` / `setCurrentCamera` choose which camera Play and game mode use.

## `@titane/renderer`

| Name | Role |
| --- | --- |
| `ThreeRenderer` | `IRenderer` driver. `{ mode: 'game' }` skips orbit, gizmos, grid |
| `setCamera` | Look-from / look-at for game hosts when no ECS camera is current |
| `applySceneCamera` | Copies the current `Camera` pose onto the perspective camera |
| `setEditorChromeEnabled` | Play-in-place hides editor chrome; snapshots / restores the orbit pose |

## Editor (dev)

Nuxt layer `@titane/editor`. Route `/titane`. Host `titane.config.ts` is imported as `~~/titane.config`. Production configs must not extend the layer. The bottom **Project** panel lists `scenes/`, `public/prefabs`, and `public/assets`.
