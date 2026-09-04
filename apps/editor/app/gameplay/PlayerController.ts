import { defineComponent, f, getComponent, Transform } from '@titane/core';

/**
 * Sample user component for the editor sandbox.
 * `speed` drives Play. `skin` is an `f.asset()` field so the Inspector
 * can pick a file from `public/assets`.
 */
export const PlayerController = defineComponent('PlayerController', {
  schema: {
    speed: f.number({ min: 0, max: 20, step: 0.1, default: 5 }),
    skin: f.asset({ accept: 'texture' }),
  },
  onUpdate({ world, entity, data, dt }) {
    const transform = getComponent(world, entity, Transform);
    if (!transform) return;
    transform.position.x += data.speed * dt;
    transform.isDirty = true;
  },
});

if (import.meta.hot) {
  import.meta.hot.accept();
}
