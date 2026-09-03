import { vi, beforeAll, beforeEach } from 'vitest';
import { initPhysics } from '../physics/session';

beforeAll(async () => {
    await initPhysics();
});

type Listener = (...args: unknown[]) => void;

type WindowHost = {
    innerWidth: number;
    innerHeight: number;
    addEventListener: (event: string, cb: Listener) => void;
    removeEventListener: (event: string, cb: Listener) => void;
    dispatchEvent: (event: { type: string }) => boolean;
    window: unknown;
};

/**
 * Input tests dispatch on `window`. Point `window` at `globalThis` rather than
 * a stub object: Rapier's WASM treats a fake `window` as a browser context and
 * then traps on `World.step()`.
 */
beforeEach(() => {
    const listeners: Record<string, Listener[]> = {};
    const host = globalThis as unknown as WindowHost;

    host.innerWidth = 1024;
    host.innerHeight = 768;
    host.addEventListener = vi.fn((event: string, cb: Listener) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
    });
    host.removeEventListener = vi.fn((event: string, cb: Listener) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(listener => listener !== cb);
    });
    host.dispatchEvent = vi.fn((event: { type: string }) => {
        listeners[event.type]?.forEach(listener => listener(event));
        return true;
    });
    host.window = globalThis;
});
