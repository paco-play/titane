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
| `field.*` | Schema DSL (`number`, `boolean`, `string`, `color`, `vec3`, `quat`, `enum`, `entity`, `asset`) |
| `createPrimitive` | Entity with `Name` + `Transform` + `Mesh` |
| `getComponent` / `addComponent` / `removeComponent` | Typed accessors |
| `playGltfClip` | Sets `Gltf.clip` + `playing`. Optional fade overrides the stored duration |
| `defineQuery` / `runQuery` | Zero-allocation iteration |
| `Phase` / `engine.addSystem` | Pipeline registration |
| `serializeWorld` / `deserializeWorld` / `isSerializedWorld` | `.titane` JSON scenes |
| `serializePrefab` / `instantiatePrefab` | Subtree templates (`public/prefabs`) |
| `TitanePlugin` / `TitaneConfig` | Host seam |

Built-in components include `Transform`, `Mesh`, `Name`, `Velocity`, `Light`, `Gltf` (`url`, `clip`, `playing`, `loop`, `fade`), `Sound`, `Camera` (`fov`, `near`, `far`, `current`), `RigidBody` (`kind`, `friction`, `restitution`), `Collider` (`kind` box/sphere/capsule/mesh, `center`, `size`, `radius`, `height`), `Sensor`, `PlayerControlled`, `Input`. `pickCurrentCamera` / `setCurrentCamera` choose which camera Play and game mode use. A `Collider` overrides `Mesh.primitive` for physics. `mesh` colliders are Rapier trimeshes from the loaded glTF (not stored in `.titane`) and force a fixed body. Changing `Gltf.clip` while playing crossfades when `fade` is greater than 0; `fade === 0` is a hard cut.

## `@titane/renderer`

| Name | Role |
| --- | --- |
| `ThreeRenderer` | `IRenderer` driver. `{ mode: 'game' }` skips orbit, gizmos, grid |
| `worldPointFromPointer` | Screen → world: first mesh hit, else the `y = 0` plane |
| `localAabb` | Local bounds of a loaded glTF or the unit primitive box |
| `meshColliderGeometry` | Triangle soup for `Collider.kind = mesh` |
| `setCamera` | Look-from / look-at for game hosts when no ECS camera is current |
| `applySceneCamera` | Copies the current `Camera` pose onto the perspective camera |
| `setEditorChromeEnabled` | Play-in-place hides editor chrome; snapshots / restores the orbit pose |

## Editor (dev)

Nuxt layer `@titane/editor`. Route `/titane`. Host `titane.config.ts` is imported as `~~/titane.config`. Production configs must not extend the layer. The bottom **Project** panel lists `scenes/`, `public/prefabs`, and `public/assets`. Double-click still spawns on the grid. Drag a tile onto the viewport to place it at the pointer (textures write `Mesh.albedo` on the mesh under the cursor).
