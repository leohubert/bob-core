/** Shell dialects the completion renderer knows about. Only `fish` is implemented so far. */
export const COMPLETION_SHELLS = ['fish', 'zsh', 'bash'] as const;

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
