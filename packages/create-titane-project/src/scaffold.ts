import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { ScaffoldOptions } from './types.ts';
import { enginePackageDirs, isTitaneCheckout, monorepoRoot, templateDir, toFileDep } from './paths.ts';

const replaceAll = (haystack: string, needle: string, value: string): string =>
    haystack.split(needle).join(value);

const copyDir = (from: string, to: string): void => {
    mkdirSync(to, { recursive: true });
    cpSync(from, to, { recursive: true });
};

const rewritePlaceholders = (dir: string, name: string): void => {
    const stack = [dir];
    while (stack.length > 0) {
        const current = stack.pop() as string;
        for (const entry of readdirSync(current)) {
            const full = join(current, entry);
            if (statSync(full).isDirectory()) {
                stack.push(full);
                continue;
            }
            if (!/\.(md|html|json|ts|vue)$/.test(entry)) continue;
            const next = replaceAll(readFileSync(full, 'utf8'), '__PROJECT_NAME__', name);
            writeFileSync(full, next);
        }
    }
};

const nuxtPackageJson = (name: string, deps: { core: string; renderer: string; editor: string }): string =>
    `${JSON.stringify({
        name,
        version: '0.0.0',
        private: true,
        type: 'module',
        scripts: {
            dev: 'nuxt dev',
            build: 'nuxt build',
            preview: 'nuxt preview',
            postinstall: 'nuxt prepare'
        },
        dependencies: {
            '@titane/core': deps.core,
            '@titane/renderer': deps.renderer,
            nuxt: '^4.4.2',
            vue: '^3.5.30',
            'vue-router': '^5.0.3'
        },
        devDependencies: {
            '@titane/editor': deps.editor,
            typescript: '^5.9.3'
        }
    }, null, 2)}\n`;

const vanillaPackageJson = (name: string, deps: { core: string; renderer: string }): string =>
    `${JSON.stringify({
        name,
        version: '0.0.0',
        private: true,
        type: 'module',
        scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview'
        },
        dependencies: {
            '@titane/core': deps.core,
            '@titane/renderer': deps.renderer
        },
        devDependencies: {
            typescript: '^5.9.3',
            vite: '^6.3.5'
        }
    }, null, 2)}\n`;

const writePackageJson = (options: ScaffoldOptions): void => {
    if (!isTitaneCheckout()) {
        throw new Error(
            '[Titane] create-titane-project must run from a Titane checkout so it can link @titane/core with file:.'
        );
    }

    const dirs = enginePackageDirs(monorepoRoot());
    const deps = {
        core: toFileDep(options.directory, dirs.core),
        renderer: toFileDep(options.directory, dirs.renderer),
        editor: toFileDep(options.directory, dirs.editor)
    };

    const body = options.template === 'nuxt'
        ? nuxtPackageJson(options.name, deps)
        : vanillaPackageJson(options.name, deps);

    writeFileSync(join(options.directory, 'package.json'), body);
};

const installDependencies = (projectDir: string): void => {
    const result = spawnSync('npm', ['install', '--legacy-peer-deps'], {
        cwd: projectDir,
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        throw new Error('[Titane] npm install failed.');
    }
};

/**
 * Copies the shared + template files, writes `package.json` with `file:` engine deps.
 */
export const scaffold = (options: ScaffoldOptions): void => {
    if (existsSync(join(options.directory, 'package.json'))) {
        throw new Error(`[Titane] Refusing to overwrite existing project at ${options.directory}`);
    }

    mkdirSync(options.directory, { recursive: true });
    copyDir(templateDir('shared'), options.directory);
    copyDir(templateDir(options.template), options.directory);
    writePackageJson(options);
    rewritePlaceholders(options.directory, options.name);

    if (options.install) installDependencies(options.directory);
};
