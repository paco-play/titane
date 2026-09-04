import { resolveOptions } from './prompts.ts';
import { parseArgs, usageText } from './args.ts';
import { scaffold } from './scaffold.ts';

/**
 * CLI entry: parse flags, prompt if needed, copy the template.
 */
export const run = async (argv: string[]): Promise<void> => {
    const flags = parseArgs(argv);
    if (flags.help) {
        process.stdout.write(usageText());
        return;
    }

    const options = await resolveOptions(flags);
    scaffold(options);
    process.stdout.write(`Created ${options.name} (${options.template}) at ${options.directory}\n`);
    if (options.template === 'nuxt') {
        process.stdout.write('Next: npm run dev  →  game at /  ·  editor at /titane\n');
    }
    else {
        process.stdout.write('Next: npm run dev  →  a cube moves. Use the nuxt template for the editor.\n');
    }
};

const isMain = process.argv[1] !== undefined && (
    process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('create-titane-project.mjs')
);

if (isMain) {
    run(process.argv.slice(2)).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
        process.exitCode = 1;
    });
}
