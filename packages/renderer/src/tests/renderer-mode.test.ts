import { describe, it, expect } from 'vitest';
import {
    resolveRendererMode,
    usesEditorChrome,
    applyCameraPose,
    type CameraPose
} from '../renderer-mode';
import { ThreeRenderer } from '../three-renderer';

describe('resolveRendererMode', () => {
    it('defaults to editor when options are omitted', () => {
        expect(resolveRendererMode()).toBe('editor');
        expect(resolveRendererMode({})).toBe('editor');
    });

    it('honours an explicit game mode', () => {
        expect(resolveRendererMode({ mode: 'game' })).toBe('game');
    });
});

describe('usesEditorChrome', () => {
    it('is true only for editor mode', () => {
        expect(usesEditorChrome('editor')).toBe(true);
        expect(usesEditorChrome('game')).toBe(false);
    });
});

describe('applyCameraPose', () => {
    it('writes position and lookAt onto the camera', () => {
        const lookAt: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
        const camera = {
            position: { set: (x: number, y: number, z: number): void => {
                camera.recorded = { x, y, z };
            } },
            lookAt: (x: number, y: number, z: number): void => {
                lookAt.x = x;
                lookAt.y = y;
                lookAt.z = z;
            },
            recorded: { x: 0, y: 0, z: 0 }
        };
        const pose: CameraPose = {
            position: { x: 8, y: 10, z: 8 },
            lookAt: { x: 1, y: 2, z: 3 }
        };

        applyCameraPose(camera, pose);

        expect(camera.recorded).toEqual(pose.position);
        expect(lookAt).toEqual(pose.lookAt);
    });
});

describe('ThreeRenderer', () => {
    it('defaults to editor mode so the existing editor stays unchanged', () => {
        expect(new ThreeRenderer().mode).toBe('editor');
        expect(new ThreeRenderer().usesEditorChrome).toBe(true);
    });

    it('accepts game mode without installing orbit or gizmos', () => {
        const renderer = new ThreeRenderer({ mode: 'game' });
        expect(renderer.mode).toBe('game');
        expect(renderer.usesEditorChrome).toBe(false);
    });
});
