import type { AnyFieldDef, Schema } from './field';
import type { InferSchema } from './infer';
import type { Quat, Vec3 } from './math';
import { cloneQuat, cloneVec3 } from './math';

/**
 * True when `value` is a non-null, non-array object.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Detached copy of a field default so two `create()` calls never share nested objects.
 */
const cloneDefault = (field: AnyFieldDef): unknown => {
    switch (field.kind) {
        case 'vec3':
            return cloneVec3(field.default);
        case 'quat':
            return cloneQuat(field.default);
        default:
            return field.default;
    }
};

/**
 * Reads a finite number from unknown JSON.
 */
const asFiniteNumber = (raw: unknown): number | undefined =>
    typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;

/**
 * Reads a `{ x, y, z }` vector, or `undefined` when the payload is unusable.
 */
const parseVec3 = (raw: unknown): Vec3 | undefined => {
    if (!isPlainObject(raw)) return undefined;
    const x = asFiniteNumber(raw.x);
    const y = asFiniteNumber(raw.y);
    const z = asFiniteNumber(raw.z);
    if (x === undefined || y === undefined || z === undefined) return undefined;
    return { x, y, z };
};

/**
 * Reads a `{ x, y, z, w }` quaternion, or `undefined` when the payload is unusable.
 */
const parseQuat = (raw: unknown): Quat | undefined => {
    if (!isPlainObject(raw)) return undefined;
    const x = asFiniteNumber(raw.x);
    const y = asFiniteNumber(raw.y);
    const z = asFiniteNumber(raw.z);
    const w = asFiniteNumber(raw.w);
    if (x === undefined || y === undefined || z === undefined || w === undefined) {
        return undefined;
    }
    return { x, y, z, w };
};

/**
 * Validates one serialized field. Invalid values yield `undefined` so the default is kept.
 */
export const parseFieldValue = (field: AnyFieldDef, raw: unknown): unknown => {
    switch (field.kind) {
        case 'number': {
            const value = asFiniteNumber(raw);
            if (value === undefined) return undefined;
            let clamped = value;
            if (field.min !== undefined) clamped = Math.max(field.min, clamped);
            if (field.max !== undefined) clamped = Math.min(field.max, clamped);
            return clamped;
        }
        case 'boolean':
            return typeof raw === 'boolean' ? raw : undefined;
        case 'string':
        case 'asset':
            return typeof raw === 'string' ? raw : undefined;
        case 'color':
            return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
        case 'vec3':
            return parseVec3(raw);
        case 'quat':
            return parseQuat(raw);
        case 'entity':
            if (raw === null) return null;
            if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0) return raw;
            return undefined;
        case 'enum':
            return typeof raw === 'string' && field.options.includes(raw) ? raw : undefined;
    }
};

/**
 * Fresh component data filled with cloned schema defaults.
 */
export const createFromSchema = <S extends Schema>(schema: S): InferSchema<S> => {
    const data: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(schema)) {
        data[key] = cloneDefault(field);
    }
    return data as InferSchema<S>;
};

/**
 * Rebuilds component data from JSON. Missing or invalid keys fall back to defaults.
 * Extra keys in `raw` are ignored so older editors cannot inject unknown fields.
 */
export const reviveFromSchema = <S extends Schema>(schema: S, raw: unknown): InferSchema<S> => {
    const data = createFromSchema(schema);
    if (!isPlainObject(raw)) return data;

    for (const [key, field] of Object.entries(schema)) {
        if (!(key in raw)) continue;
        const parsed = parseFieldValue(field, raw[key]);
        if (parsed !== undefined) {
            (data as Record<string, unknown>)[key] = parsed;
        }
    }

    return data;
};

/**
 * Writes revived schema values onto an existing data object, keeping identity
 * so Inspector bindings and SoA views stay live. Unknown keys are dropped.
 */
export const applySchemaInPlace = (schema: Schema, data: Record<string, unknown>): void => {
    const revived = reviveFromSchema(schema, data) as Record<string, unknown>;
    for (const key of Object.keys(data)) {
        if (!(key in schema)) delete data[key];
    }
    for (const [key, value] of Object.entries(revived)) {
        data[key] = value;
    }
};

