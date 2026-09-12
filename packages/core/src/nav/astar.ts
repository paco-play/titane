import type { NavData } from '../ecs/components/nav';
import { NAV_MAX_AXIS, navCellIndex, navIsWalkable } from '../ecs/components/nav';

type Cell = { ix: number; iz: number };

const CARDINALS: readonly Cell[] = [
    { ix: 1, iz: 0 },
    { ix: -1, iz: 0 },
    { ix: 0, iz: 1 },
    { ix: 0, iz: -1 }
];

const DIAGONALS: readonly Cell[] = [
    { ix: 1, iz: 1 },
    { ix: 1, iz: -1 },
    { ix: -1, iz: 1 },
    { ix: -1, iz: -1 }
];

const heuristic = (a: Cell, b: Cell): number => {
    const dx = Math.abs(a.ix - b.ix);
    const dz = Math.abs(a.iz - b.iz);
    return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz);
};

/**
 * A* over a baked nav grid. Returns cell indices from start to goal, or
 * `null` when either end is blocked / out of range, or no path exists.
 */
export const findNavPath = (
    nav: NavData,
    start: Cell,
    goal: Cell
): Cell[] | null => {
    if (!navIsWalkable(nav, start.ix, start.iz) || !navIsWalkable(nav, goal.ix, goal.iz)) {
        return null;
    }
    if (start.ix === goal.ix && start.iz === goal.iz) return [start];

    const startIndex = navCellIndex(nav, start.ix, start.iz);
    const goalIndex = navCellIndex(nav, goal.ix, goal.iz);
    if (startIndex < 0 || goalIndex < 0) return null;

    const size = nav.width * nav.depth;
    const cameFrom = new Int32Array(size).fill(-1);
    const gScore = new Float64Array(size).fill(Infinity);
    const open: Cell[] = [start];
    const openSet = new Set<number>([startIndex]);
    gScore[startIndex] = 0;

    while (open.length > 0) {
        let best = 0;
        let bestF = Infinity;
        for (let i = 0; i < open.length; i++) {
            const cell = open[i];
            const idx = navCellIndex(nav, cell.ix, cell.iz);
            const f = gScore[idx] + heuristic(cell, goal);
            if (f < bestF) {
                bestF = f;
                best = i;
            }
        }

        const current = open.splice(best, 1)[0];
        const currentIndex = navCellIndex(nav, current.ix, current.iz);
        openSet.delete(currentIndex);
        if (currentIndex === goalIndex) return reconstruct(cameFrom, nav, goal);

        for (const step of CARDINALS) {
            consider(nav, current, currentIndex, step, 1, gScore, cameFrom, open, openSet);
        }
        for (const step of DIAGONALS) {
            const sideA = navIsWalkable(nav, current.ix + step.ix, current.iz);
            const sideB = navIsWalkable(nav, current.ix, current.iz + step.iz);
            if (!sideA || !sideB) continue;
            consider(nav, current, currentIndex, step, Math.SQRT2, gScore, cameFrom, open, openSet);
        }
    }

    return null;
};

const consider = (
    nav: NavData,
    current: Cell,
    currentIndex: number,
    step: Cell,
    cost: number,
    gScore: Float64Array,
    cameFrom: Int32Array,
    open: Cell[],
    openSet: Set<number>
): void => {
    const ix = current.ix + step.ix;
    const iz = current.iz + step.iz;
    if (!navIsWalkable(nav, ix, iz)) return;
    const index = navCellIndex(nav, ix, iz);
    if (index < 0 || index >= NAV_MAX_AXIS * NAV_MAX_AXIS) return;
    const tentative = gScore[currentIndex] + cost;
    if (tentative >= gScore[index]) return;
    cameFrom[index] = currentIndex;
    gScore[index] = tentative;
    if (!openSet.has(index)) {
        open.push({ ix, iz });
        openSet.add(index);
    }
};

const reconstruct = (cameFrom: Int32Array, nav: NavData, goal: Cell): Cell[] => {
    const path: Cell[] = [goal];
    let index = navCellIndex(nav, goal.ix, goal.iz);
    while (index >= 0 && cameFrom[index] >= 0) {
        index = cameFrom[index];
        path.push({
            ix: index % nav.width,
            iz: Math.floor(index / nav.width)
        });
    }
    path.reverse();
    return path;
};
