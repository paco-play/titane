import type { Entity } from '../types';
import type { Quat, Vec3 } from './math';

/**
 * Discriminator for Inspector widgets and deserialize validation.
 */
export type FieldKind =
    | 'number'
    | 'boolean'
    | 'string'
    | 'color'
    | 'vec3'
    | 'quat'
    | 'enum'
    | 'entity';

/**
 * One authored field. `T` is what TypeScript infers for the data property.
 */
export interface FieldDef<T> {
    readonly kind: FieldKind;
    readonly default: T;
}

/** Numeric scalar. `min` + `max` select a slider in the Inspector. */
export interface NumberFieldDef extends FieldDef<number> {
    readonly kind: 'number';
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
}

/** Toggle. */
export interface BooleanFieldDef extends FieldDef<boolean> {
    readonly kind: 'boolean';
}

/** Free text. */
export interface StringFieldDef extends FieldDef<string> {
    readonly kind: 'string';
}

/** Hex color, e.g. `#4ade80`. */
export interface ColorFieldDef extends FieldDef<string> {
    readonly kind: 'color';
}

/** Three numeric axes. */
export interface Vec3FieldDef extends FieldDef<Vec3> {
    readonly kind: 'vec3';
}

/** Quaternion. */
export interface QuatFieldDef extends FieldDef<Quat> {
    readonly kind: 'quat';
}

/** Entity reference. `null` means unassigned. */
export interface EntityFieldDef extends FieldDef<Entity | null> {
    readonly kind: 'entity';
}

/** Closed string set. `T` is the union of the option literals. */
export interface EnumFieldDef<T extends string> extends FieldDef<T> {
    readonly kind: 'enum';
    readonly options: readonly T[];
}

/** Any field definition the DSL can produce. */
export type AnyFieldDef =
    | NumberFieldDef
    | BooleanFieldDef
    | StringFieldDef
    | ColorFieldDef
    | Vec3FieldDef
    | QuatFieldDef
    | EntityFieldDef
    | EnumFieldDef<string>;

/**
 * User component schema: a flat record of field definitions.
 * Nested objects are out of scope until a real use case needs them.
 */
export type Schema = Record<string, AnyFieldDef>;
