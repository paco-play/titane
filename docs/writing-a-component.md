# Writing a component

A user component is a schema plus optional lifecycle hooks. The schema is the single source of truth: TypeScript type, Inspector widgets, defaults, and deserialize validation.

```ts
import { defineComponent, field, getComponent, Transform } from '@titane/core';

export const PlayerController = defineComponent('PlayerController', {
  schema: {
    speed: field.number({ min: 0, max: 20, step: 0.1, default: 5 })
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

Restart `npm run dev` (or let Vite reload). In the editor, select an entity → **Add Component** → `PlayerController`. Edit `speed`. Ctrl+S writes `scenes/main.titane`. The value is in the `.titane` data, not in generated code.

`field.asset({ accept: 'texture' })` stores a URL string. The Inspector shows a text field plus a list of matching files under `public/assets`.

A prefab is a subtree saved as `.titane` under `public/prefabs`. Inspector **Save as Prefab** downloads the selection; Hierarchy **+** stamps a copy into the scene. Entity refs that pointed outside the subtree become `null`.

## Field kinds

| Schema | Inspector |
| --- | --- |
| `field.number({ min, max, step })` | Slider + numeric input |
| `field.number()` | Drag-input |
| `field.boolean()` | Toggle |
| `field.string()` | Text |
| `field.color()` | Color picker |
| `field.vec3()` | Three drag-inputs |
| `field.quat()` | Four numeric inputs |
| `field.enum([...])` | Select |
| `field.entity()` | Entity reference |
| `field.asset({ accept })` | URL + picker from `public/assets` (`texture` / `model` / `audio`) |

Hooks: `onStart` once when simulating begins (and again after a snapshot restore), `onUpdate` every fixed step while Playing, `onDestroy` when the component is removed. Throws are isolated per entity; the editor keeps ticking.

Do not put callbacks in `.titane`. Do not generate component code from the editor.
