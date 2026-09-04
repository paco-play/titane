import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { scaffold } from '../scaffold.ts';
import { parseArgs, assertTemplate } from '../args.ts';
import { toFileDep, toPackageName } from '../paths.ts';

describe('create-titane-project', () => {
    it('parses non-interactive flags', () => {
        const flags = parseArgs([
            '--name', 'demo-cube',
            '--template', 'vanilla',
            '--dir', '/tmp/demo-cube',
            '--no-install',
            '--yes'
        ]);
        expect(flags.name).toBe('demo-cube');
        expect(flags.template).toBe('vanilla');
        expect(flags.directory).toBe('/tmp/demo-cube');
        expect(flags.install).toBe(false);
        expect(flags.yes).toBe(true);
    });

    it('rejects unknown templates instead of faking them', () => {
        expect(() => assertTemplate('next')).toThrow(/Unknown template/);
        expect(() => assertTemplate('sveltekit')).toThrow(/Unknown template/);
    });

    it('slugifies package names', () => {
        expect(toPackageName('My Game')).toBe('my-game');
        expect(toPackageName('***')).toBe('my-titane-game');
    });

    it('builds file: deps as relative paths', () => {
        expect(toFileDep('/a/b/game', '/a/packages/core')).toBe('file:../../packages/core');
    });

    it('writes the nuxt convention and a moving-cube scene', () => {
        const directory = join(mkdtempSync(join(tmpdir(), 'titane-nuxt-')), 'game');
        scaffold({
            name: 'hello-cube',
            template: 'nuxt',
            directory,
            install: false
        });

        expect(existsSync(join(directory, 'titane.config.ts'))).toBe(true);
        expect(existsSync(join(directory, 'scenes', 'main.titane'))).toBe(true);
        expect(existsSync(join(directory, 'src', 'components', 'PlayerController.ts'))).toBe(true);
        expect(existsSync(join(directory, 'public', 'assets', '.gitkeep'))).toBe(true);
        expect(existsSync(join(directory, 'app', 'pages', 'index.vue'))).toBe(true);
        expect(existsSync(join(directory, 'nuxt.config.ts'))).toBe(true);
        expect(existsSync(join(directory, '.npmrc'))).toBe(true);

        const scene = readFileSync(join(directory, 'scenes', 'main.titane'), 'utf8');
        expect(scene).toContain('PlayerController');

        const nuxt = readFileSync(join(directory, 'nuxt.config.ts'), 'utf8');
        expect(nuxt).toContain('@titane/editor');
        expect(nuxt).toContain('production');

        const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')) as {
            name: string
            dependencies: Record<string, string>
            devDependencies: Record<string, string>
        };
        expect(pkg.name).toBe('hello-cube');
        expect(pkg.dependencies['@titane/core']).toMatch(/^file:/);
        expect(pkg.devDependencies['@titane/editor']).toMatch(/^file:/);
        expect(existsSync(join(directory, 'node_modules'))).toBe(false);
    });

    it('writes a vanilla vite game without the editor package', () => {
        const directory = join(mkdtempSync(join(tmpdir(), 'titane-vanilla-')), 'game');
        scaffold({
            name: 'plain-cube',
            template: 'vanilla',
            directory,
            install: false
        });

        expect(existsSync(join(directory, 'src', 'main.ts'))).toBe(true);
        expect(existsSync(join(directory, 'vite.config.ts'))).toBe(true);
        expect(readFileSync(join(directory, 'index.html'), 'utf8')).toContain('plain-cube');

        const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')) as {
            dependencies: Record<string, string>
            devDependencies: Record<string, string>
        };
        expect(pkg.dependencies['@titane/core']).toMatch(/^file:/);
        expect(pkg.devDependencies['@titane/editor']).toBeUndefined();
    });
});
