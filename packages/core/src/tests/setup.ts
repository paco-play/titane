import { vi, beforeEach } from 'vitest';

// Provide a globally refreshed mock for window so the Node environment doesn't crash on browser API access
beforeEach(() => {
    const listeners: Record<string, Function[]> = {};
    (globalThis as { window: unknown }).window = {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: vi.fn((event: string, cb: Function) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: Function) => {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(l => l !== cb);
        }),
        dispatchEvent: vi.fn((event: any) => {
            if (listeners[event.type]) {
                listeners[event.type].forEach((cb: Function) => cb(event));
            }
        })
    };
});
