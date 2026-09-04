import { defineComponent, f, getComponent, Transform } from '@titane/core';

/**
 * Sample user component for the editor sandbox.
 * Declaring `speed` here is enough for Add Component, the Inspector slider,
 * and `.titane` persistence — no editor source has to mention this type.
 */
export const PlayerController = defineComponent('PlayerController', {
  schema: {
    speed: f.number({ min: 0, max: 20, step: 0.1, default: 5 }),
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
