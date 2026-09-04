import type { TitaneEngine } from './engine';

/**
 * Named extension that registers systems (and later components / field types)
 * without forking the core. The project calls `engine.use(plugin)` at boot.
 */
export interface TitanePlugin {
    readonly name: string;
    register(engine: TitaneEngine): void;
}

/**
 * Canonical plugin id. Empty names and duplicates are rejected so a boot
 * script cannot silently register twice.
 */
export const resolvePluginName = (name: string, registered: ReadonlySet<string>): string => {
    const id = name.trim();
    if (id === '') {
        throw new Error('[Titane] Plugin name must not be empty.');
    }
    if (registered.has(id)) {
        throw new Error(`[Titane] Plugin "${id}" is already registered.`);
    }
    return id;
};
