import type { FieldDef, Schema } from './field';

/**
 * Data type stored for one field definition.
 */
export type InferField<F> = F extends FieldDef<infer T> ? T : never;

/**
 * Data type inferred from a schema. This is the TypeScript type of the
 * component: there is no parallel `interface` to keep in sync.
 */
export type InferSchema<S extends Schema> = {
    [K in keyof S]: InferField<S[K]>;
};
