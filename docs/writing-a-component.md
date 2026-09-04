# Writing a component

A user component is a schema plus optional lifecycle hooks. The schema is the single source of truth: TypeScript type, Inspector widgets, defaults, and deserialize validation.

```ts
import { defineComponent, f, getComponent, Transform } from '@titane/core';

export const PlayerController = defineComponent('PlayerController', {
  schema: {
    speed: f.number({ min: 0, max: 20, step: 0.1, default: 5 })
  },
  onUpdate({ world, entity, data, dt }) {
    const transform = getComponent(world, entity, Transform);
    if (!transform) return;
    transform.position.x += data.speed * dt;
    transform.isDirty = true;
  }
});
```

Put the file in `src/components/`. Register it from a plugin listed in `titane.config.ts`:

```ts
import type { TitanePlugin } from '@titane/core';
import { PlayerController } from './PlayerController';

export const gameplayPlugin: TitanePlugin = {
  name: 'gameplay',
  register(engine) {
    engine.registerComponent(PlayerController);
  }
};
```

Restart `npm run dev` (or let Vite reload). In the editor, select an entity → **Add Component** → `PlayerController`. Edit `speed`. Save. The value is in the `.titane` data, not in generated code.

## Field kinds

| Schema | Inspector |
| --- | --- |
| `f.number({ min, max, step })` | Slider + numeric input |
| `f.number()` | Drag-input |
| `f.boolean()` | Toggle |
| `f.string()` | Text |
| `f.color()` | Color picker |
| `f.vec3()` | Three drag-inputs |
| `f.quat()` | Four numeric inputs |
| `f.enum([...])` | Select |
| `f.entity()` | Entity reference |

Hooks: `onStart` once when simulating begins (and again after a snapshot restore), `onUpdate` every fixed step while Playing, `onDestroy` when the component is removed. Throws are isolated per entity; the editor keeps ticking.

Do not put callbacks in `.titane`. Do not generate component code from the editor.
