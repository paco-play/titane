import { defineComponent, field, getComponent, Transform } from '@titane/core';

/**
 * Sample user component for the editor sandbox.
 * `speed` drives Play. `skin` is an asset URL so the Inspector can pick
 * can pick a file from `public/assets`.
 */
export const PlayerController = defineComponent('PlayerController', {
  schema: {
    speed: field.number({ min: 0, max: 20, step: 0.1, default: 5 }),
    skin: field.asset({ accept: 'texture' }),
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
