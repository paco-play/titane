import { vi } from 'vitest';
import type { IRenderer } from '../runtime/renderer-interface';

/**
 * Headless `IRenderer` for engine tests. Pick helpers return a miss / origin.
 */
export const createMockRenderer = (): IRenderer => ({
    init: vi.fn(),
    render: vi.fn(),
    handleResize: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn(),
    pick: vi.fn(() => null),
    worldPointFromPointer: vi.fn(() => ({ x: 0, y: 0, z: 0 }))
});
