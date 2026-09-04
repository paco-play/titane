import type { TitaneEngine } from './engine';

/**
 * Named extension that registers systems and user components without
 * forking the core. The project calls `engine.use(plugin)` at boot.
 */
export interface TitanePlugin {
    readonly name: string;
    register(engine: TitaneEngine): void;
}

/**
 * Host project file `titane.config.ts`. Plugins populate the registry at boot
 * so `.titane` scripts resolve by id and Add Component can list them.
 */
export interface TitaneConfig {
    readonly plugins: readonly TitanePlugin[];
}

/**
 * Registers every plugin from a project's {@link TitaneConfig}.
 * @param engine - The engine to extend.
 * @param config - The project's `titane.config.ts` export.
 */
export const applyTitaneConfig = (engine: TitaneEngine, config: TitaneConfig): void => {
    for (const plugin of config.plugins) {
        engine.use(plugin);
    }
};

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
