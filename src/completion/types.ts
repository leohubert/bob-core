/**
 * Shells with a renderer. A dialect joins this list only once it has one — advertising a shell and
 * then refusing it at runtime is worse than not offering it, and `Args.option` rejects anything not
 * listed here with the framework's own invalid-value error.
 */
export const COMPLETION_SHELLS = ['fish'] as const;

export type CompletionShell = (typeof COMPLETION_SHELLS)[number];

/** A single suggestion. `description` is rendered inline by shells that support it. */
export type CompletionCandidate = {
	value: string;
	description?: string;
};

/** Name of the hidden command shells call on every keypress. */
export const COMPLETE_COMMAND = '__complete';

/** Name of the user-facing command that prints an installable completion script. */
export const COMPLETION_COMMAND = 'completion';

/**
 * Protocol between the generated shell script and {@link COMPLETE_COMMAND}:
 *
 *   <bin> __complete <shell> --current=<token> -- <tokens…>
 *
 * The token under the cursor travels in an `=`-joined flag rather than as a trailing argument
 * because an empty command substitution contributes *zero* arguments in fish — so a trailing
 * form cannot distinguish `bdg k9s <TAB>` (complete k9s' flags) from `bdg k9s<TAB>`
 * (complete command names starting with "k9s").
 */
export const CURRENT_TOKEN_FLAG = '--current=';

/**
 * True when this invocation's stdout is consumed by a machine — a candidate list the shell reads
 * back, or a script the user redirects into a file.
 *
 * A host with startup side effects (a banner, an update check, a rebuild) must stay silent on stdout
 * for these, and should skip the work entirely for `__complete`, which runs on every keypress.
 */
export function writesMachineOutput(argv: string[]): boolean {
	const command = argv.at(0);

	return command === COMPLETE_COMMAND || command === COMPLETION_COMMAND;
}
