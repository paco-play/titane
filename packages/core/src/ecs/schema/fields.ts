import type { Entity } from '../types';
import type {
    BooleanFieldDef,
    ColorFieldDef,
    EntityFieldDef,
    EnumFieldDef,
    NumberFieldDef,
    QuatFieldDef,
    StringFieldDef,
    Vec3FieldDef
} from './field';
import { IDENTITY_QUAT, ZERO_VEC3, cloneQuat, cloneVec3, type Quat, type Vec3 } from './math';

/** Options for {@link f.number}. */
export interface NumberFieldOptions {
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
    readonly default?: number;
}

/** Options for fields that only override the default value. */
export interface DefaultFieldOptions<T> {
    readonly default?: T;
}

/**
 * House field DSL. A schema built from these factories infers the component
 * data type, drives Inspector widgets, and validates `.titane` payloads.
 */
export const f = {
    /**
     * Numeric scalar. Provide both `min` and `max` for a slider widget.
     */
    number: (options: NumberFieldOptions = {}): NumberFieldDef => ({
        kind: 'number',
        default: options.default ?? 0,
        min: options.min,
        max: options.max,
        step: options.step
    }),

    /** Boolean toggle. */
    boolean: (options: DefaultFieldOptions<boolean> = {}): BooleanFieldDef => ({
        kind: 'boolean',
        default: options.default ?? false
    }),

    /** Free-form string. */
    string: (options: DefaultFieldOptions<string> = {}): StringFieldDef => ({
        kind: 'string',
        default: options.default ?? ''
    }),

    /** Hex color string. */
    color: (options: DefaultFieldOptions<string> = {}): ColorFieldDef => ({
        kind: 'color',
        default: options.default ?? '#ffffff'
    }),

    /** `{ x, y, z }` vector. */
    vec3: (options: DefaultFieldOptions<Vec3> = {}): Vec3FieldDef => ({
        kind: 'vec3',
        default: cloneVec3(options.default ?? ZERO_VEC3)
    }),

    /** `{ x, y, z, w }` quaternion. */
    quat: (options: DefaultFieldOptions<Quat> = {}): QuatFieldDef => ({
        kind: 'quat',
        default: cloneQuat(options.default ?? IDENTITY_QUAT)
    }),

    /** Entity id, or `null` when nothing is referenced. */
    entity: (options: DefaultFieldOptions<Entity | null> = {}): EntityFieldDef => ({
        kind: 'entity',
        default: options.default ?? null
    }),

    /**
     * Closed set of string literals. The TypeScript type is the union of `options`.
     * @param options - At least one value. The first is the default unless overridden.
     */
    enum: <const T extends string>(
        options: readonly T[],
        extras: DefaultFieldOptions<T> = {}
    ): EnumFieldDef<T> => {
        const fallback = extras.default ?? options[0];
        if (fallback === undefined) {
            throw new Error('[Titane] f.enum requires at least one option.');
        }
        return {
            kind: 'enum',
            options,
            default: fallback
        };
    }
};
