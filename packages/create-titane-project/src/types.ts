/**
 * Scaffold templates shipped with `create-titane-project`.
 */
export const TEMPLATES = ['nuxt', 'vanilla'] as const;

/** A template the CLI knows how to copy. */
export type TemplateId = (typeof TEMPLATES)[number];

/**
 * Fully resolved options for {@link scaffold}.
 */
export interface ScaffoldOptions {
    /** npm package name and default directory leaf. */
    name: string;
    template: TemplateId;
    /** Absolute output directory. */
    directory: string;
    /** Run `npm install` after writing files. */
    install: boolean;
}

/**
 * CLI flags before prompts fill the gaps.
 */
export interface ScaffoldCliFlags {
    name?: string;
    template?: string;
    directory?: string;
    install?: boolean;
    yes?: boolean;
}
