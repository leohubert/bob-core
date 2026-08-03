import { Command } from '@/src/Command.js';
import { Args } from '@/src/args/index.js';
import { isImplemented, renderCompletionScript } from '@/src/completion/render.js';
import { COMPLETION_COMMAND, COMPLETION_SHELLS, CompletionShell } from '@/src/completion/types.js';
import type { FlagsSchema, Parsed } from '@/src/lib/types.js';

export type CompletionCommandOptions = {
	binName: string;
};

/**
 * Prints the shell script that wires up completion. Installing it is the host CLI's business —
 * every shell puts it somewhere different, and only the host knows whether it wants to manage
 * the user's dotfiles.
 */
export default class CompletionCommand extends Command {
	static command = COMPLETION_COMMAND;
	static description = 'Print the shell script that enables command completion';

	static args = {
		shell: Args.option({
			options: COMPLETION_SHELLS,
			required: true,
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

	async handle(_ctx: unknown, { args }: Parsed<typeof CompletionCommand>): Promise<number | void> {
		const shell = args.shell as CompletionShell;

		if (!isImplemented(shell)) {
			this.logger.error(`Completion for ${shell} is not implemented yet.`);
			return 1;
		}

		this.logger.log(renderCompletionScript(shell, { binName: this.opts.binName }));
	}
}
