import { parseArgs as parseNodeArgs } from 'node:util';
import { TEMPLATES, type ScaffoldCliFlags, type TemplateId } from './types.ts';

const USAGE = `Usage: create-titane-project [options]

Options:
  --name <name>          Project name (default: my-titane-game)
  --template <id>        ${TEMPLATES.join(' | ')}
  --dir <path>           Output directory (default: ./<name>)
  --install              Run npm install after scaffolding
  --no-install           Skip npm install
  --yes                  Skip prompts; use flags and defaults
  -h, --help             Show this help
`;

/**
 * Parses `process.argv` into CLI flags. Unknown templates stay as strings
 * so the caller can print a precise error.
 */
export const parseArgs = (argv: string[]): ScaffoldCliFlags & { help?: boolean } => {
    const { values } = parseNodeArgs({
        args: argv,
        options: {
            name: { type: 'string' },
            template: { type: 'string' },
            dir: { type: 'string' },
            install: { type: 'boolean' },
            'no-install': { type: 'boolean' },
            yes: { type: 'boolean', short: 'y' },
            help: { type: 'boolean', short: 'h' }
        },
        allowPositionals: false
    });

    const flags: ScaffoldCliFlags & { help?: boolean } = {};
    if (values.help) flags.help = true;
    if (values.name) flags.name = values.name;
    if (values.template) flags.template = values.template;
    if (values.dir) flags.directory = values.dir;
    if (values.yes) flags.yes = true;
    if (values['no-install']) flags.install = false;
    else if (values.install) flags.install = true;
    return flags;
};

/**
 * Narrows a user-supplied template id.
 * @throws If the id is not a shipped template.
 */
export const assertTemplate = (id: string): TemplateId => {
    if ((TEMPLATES as readonly string[]).includes(id)) return id as TemplateId;
    throw new Error(
        `[Titane] Unknown template "${id}". Available: ${TEMPLATES.join(', ')}.`
        + ' Next and SvelteKit hosts are not scaffolded yet; use nuxt (editor in dev) or vanilla.'
    );
};

export const usageText = (): string => USAGE;
