import path from 'node:path';

import { Command } from '@/src/Command.js';
import { Args } from '@/src/args/index.js';
import { fishCompletionPath, renderFishScript } from '@/src/completion/fish.js';
import { COMPLETION_COMMAND, COMPLETION_SHELLS, CompletionShell } from '@/src/completion/types.js';
import type { FlagsSchema } from '@/src/lib/types.js';

export type CompletionCommandOptions = {
	binName: string;
};

/**
 * The shell to render when the user does not name one.
 *
 * Returns null for anything unsupported, and that matters: `CommandParser` returns a default
 * *without* running it through the definition's `parse`, so an unlisted value here would reach
 * `handle` having skipped validation entirely. Null leaves `required` to reject it instead.
 */
function detectShell(): CompletionShell | null {
	const shell = path.basename(process.env.SHELL ?? '');

	return (COMPLETION_SHELLS as readonly string[]).includes(shell) ? (shell as CompletionShell) : null;
}

/**
 * Prints the shell script that wires up completion. Installing it is the host CLI's business —
 * every shell puts it somewhere different, and only the host knows whether it wants to manage
 * the user's dotfiles.
 *
 * The `shell` argument is validated and then unused: fish is the only dialect with a renderer, but
 * `completion fish` is the spelling users expect, and this is where a second dialect would branch.
 *
 * Prompting is off because this command's output is meant to be redirected. A missing value has a
 * default worth having (the user's own shell), and if that fails an error is the right answer — an
 * interactive prompt would render itself into whatever file stdout points at.
 */
export default class CompletionCommand extends Command {
	static command = COMPLETION_COMMAND;
	static description = 'Print the shell script that enables command completion';
	static disablePrompting = true;

	static args = {
		shell: Args.option({
			options: COMPLETION_SHELLS,
			required: true,
			default: detectShell,
			description: 'Shell to generate completion for',
		}),
	} satisfies FlagsSchema;

	static examples = [
		{
			description: 'Install fish completion',
			command: 'completion fish > ~/.config/fish/completions/cli.fish',
		},
	];

	constructor(private opts: CompletionCommandOptions) {
		super();
	}

	async handle(): Promise<void> {
		const { binName } = this.opts;

		this.logger.log(renderFishScript({ binName }));
		// On stderr, so a redirected stdout stays a pure script. The `#` keeps it a valid fish comment
		// for anyone who captures both streams into the same file by accident.
		this.logger.error(`# Save this to enable completion:\n#   ${binName} ${COMPLETION_COMMAND} fish > ${fishCompletionPath(binName)}`);
	}
}
