import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import type { ScaffoldCliFlags, ScaffoldOptions, TemplateId } from './types.ts';
import { assertTemplate } from './args.ts';
import { resolveProjectDir, toPackageName } from './paths.ts';

const DEFAULT_NAME = 'my-titane-game';

const ask = async (
    rl: { question: (q: string) => Promise<string> },
    prompt: string,
    fallback: string
): Promise<string> => {
    const answer = (await rl.question(prompt)).trim();
    return answer.length > 0 ? answer : fallback;
};

/**
 * Fills missing flags. Interactive when stdin is a TTY and `--yes` is off.
 */
export const resolveOptions = async (
    flags: ScaffoldCliFlags,
    cwd = process.cwd()
): Promise<ScaffoldOptions> => {
    const skipPrompts = flags.yes === true || !stdin.isTTY;

    let name = flags.name ? toPackageName(flags.name) : DEFAULT_NAME;
    let template: TemplateId = flags.template ? assertTemplate(flags.template) : 'nuxt';
    let install = flags.install ?? true;

    if (!skipPrompts) {
        const rl = createInterface({ input: stdin, output: stdout });
        try {
            name = toPackageName(await ask(rl, `Project name (${name}): `, name));
            const templateLabel = await ask(
                rl,
                `Template — nuxt (editor at /titane) or vanilla (${template}): `,
                template
            );
            template = assertTemplate(templateLabel);
            const installLabel = await ask(rl, 'Install dependencies? (Y/n): ', install ? 'y' : 'n');
            install = !/^n/i.test(installLabel);
        }
        finally {
            rl.close();
        }
    }
    else if (flags.template) {
        template = assertTemplate(flags.template);
    }

    const directory = resolveProjectDir(flags.directory ?? `./${name}`, cwd);

    return { name, template, directory, install };
};
