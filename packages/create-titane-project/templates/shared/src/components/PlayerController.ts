import { defineComponent, field, getComponent, Transform } from '@titane/core';

/**
 * Sample user component. Declaring `speed` here is enough for Add Component,
 * the Inspector slider, and `.titane` persistence.
 */
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
