# ECS concepts

Titane stores the world as **entities** (numeric ids) plus **components** (pure data). **Systems** iterate queries and write data. Nothing gameplay-shaped lives in the renderer.

## Entity

An entity is a `number`. `createEntity(world)` allocates one. `createPrimitive` is a helper that also adds `Name`, `Transform`, and `Mesh`.

## Component

A component is a typed blob interned with `defineComponent`. Built-ins (`Transform`, `Mesh`, `Light`, `Camera`, …) use a factory. User gameplay uses a **schema**:

```ts
export const PlayerController = defineComponent('PlayerController', {
  schema: {
    speed: field.number({ min: 0, max: 20, step: 0.1, default: 5 })
  }
});
```

The id (`PlayerController`) is what `.titane` stores. The file never stores functions.

If the script is missing at load time, the payload is kept as an **orphan** (missing-script row in the Inspector).

## System

A system is `(world, dt) => void` registered into a `Phase` (`INPUT`, `UPDATE`, `PHYSICS`, `POST_PHYSICS`, `RENDER`).

User `onStart` / `onUpdate` / `onDestroy` are the ergonomic API. Internally they run as **one batched UPDATE system per component type**, and only while the engine is simulating (Play or `step()`).

## Plugin

```ts
export const gameplayPlugin: TitanePlugin = {
  name: 'gameplay',
  register(engine) {
    engine.registerComponent(PlayerController);
  }
};
```

`titane.config.ts` lists plugins. `applyTitaneConfig(engine, titaneConfig)` runs at boot for both the game and the editor so Add Component and deserialize see the same registry.

## Scene files

`.titane` is JSON: entity ids, component values, hierarchy. Load with `deserializeWorld` then `engine.loadWorld`. Behavior always comes from TypeScript, never from the file.
