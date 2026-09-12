import { defineComponent } from '../kernel/registry';

/** Hard cap so a huge floor cannot explode the baked grid. */
export const NAV_MAX_AXIS = 128;

/** Default raster size, in world units. */
export const NAV_DEFAULT_CELL = 0.5;

/**
 * Baked 2.5D nav grid. Authored on World (`ensureNav`). `cells` is row-major
 * `z * width + x`, `1` walkable / `0` blocked. Empty `cells` means unbaked.
 */
export interface NavData {
    cellSize: number;
    agentRadius: number;
    agentHeight: number;
    originX: number;
    originY: number;
    originZ: number;
    width: number;
    depth: number;
    cells: number[];
}

const asFinite = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asPositive = (value: unknown, fallback: number): number =>
    Math.max(0.05, asFinite(value, fallback));

const asCount = (value: unknown): number =>
    Math.max(0, Math.floor(asFinite(value, 0)));

const asCells = (value: unknown, length: number): number[] => {
    if (!Array.isArray(value) || length <= 0) return [];
    const cells = new Array<number>(length);
    for (let i = 0; i < length; i++) cells[i] = value[i] === 1 ? 1 : 0;
    return cells;
};

/**
 * Empty unbaked nav settings.
 */
export const createNav = (
    cellSize = NAV_DEFAULT_CELL,
    agentRadius = 0.4,
    agentHeight = 1.8
): NavData => ({
    cellSize: asPositive(cellSize, NAV_DEFAULT_CELL),
    agentRadius: asPositive(agentRadius, 0.4),
    agentHeight: asPositive(agentHeight, 1.8),
    originX: 0,
    originY: 0,
    originZ: 0,
    width: 0,
    depth: 0,
    cells: []
});

const reviveNav = (raw: unknown): NavData => {
    const source = raw as Partial<NavData>;
    const nav = createNav(source.cellSize, source.agentRadius, source.agentHeight);
    nav.originX = asFinite(source.originX, 0);
    nav.originY = asFinite(source.originY, 0);
    nav.originZ = asFinite(source.originZ, 0);
    nav.width = Math.min(NAV_MAX_AXIS, asCount(source.width));
    nav.depth = Math.min(NAV_MAX_AXIS, asCount(source.depth));
    nav.cells = asCells(source.cells, nav.width * nav.depth);
    if (nav.cells.length !== nav.width * nav.depth) {
        nav.width = 0;
        nav.depth = 0;
        nav.cells = [];
    }
    return nav;
};

export const Nav = defineComponent<NavData>('nav', () => createNav(), reviveNav);

/** True when a bake produced at least one cell. */
export const navHasGrid = (nav: NavData): boolean =>
    nav.width > 0 && nav.depth > 0 && nav.cells.length === nav.width * nav.depth;

/** Cell index, or `-1` when out of range. */
export const navCellIndex = (nav: NavData, ix: number, iz: number): number => {
    if (ix < 0 || iz < 0 || ix >= nav.width || iz >= nav.depth) return -1;
    return iz * nav.width + ix;
};

export const navIsWalkable = (nav: NavData, ix: number, iz: number): boolean => {
    const index = navCellIndex(nav, ix, iz);
    return index >= 0 && nav.cells[index] === 1;
};

/** Cell containing a world XZ, or `null` outside the baked rect. */
export const worldToNavCell = (
    nav: NavData,
    x: number,
    z: number
): { ix: number; iz: number } | null => {
    if (!navHasGrid(nav)) return null;
    const ix = Math.floor((x - nav.originX) / nav.cellSize);
    const iz = Math.floor((z - nav.originZ) / nav.cellSize);
    if (navCellIndex(nav, ix, iz) < 0) return null;
    return { ix, iz };
};

/** World-space center of a cell, Y is the bake floor. */
export const navCellWorld = (
    nav: NavData,
    ix: number,
    iz: number
): { x: number; y: number; z: number } => ({
    x: nav.originX + (ix + 0.5) * nav.cellSize,
    y: nav.originY,
    z: nav.originZ + (iz + 0.5) * nav.cellSize
});
