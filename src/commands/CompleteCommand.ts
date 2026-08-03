import { Command, CommandRunOption } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { parseCompletionRequest } from '@/src/completion/complete.js';
import { encodeCandidates, isImplemented } from '@/src/completion/render.js';
import { resolveCompletion } from '@/src/completion/resolve.js';
import { commandSpecs } from '@/src/completion/specs.js';
import { COMPLETE_COMMAND } from '@/src/completion/types.js';

export type CompleteCommandOptions = {
	commandRegistry: CommandRegistry;
};

/**
 * The hidden endpoint the generated shell scripts call on every keypress. The wire protocol is
 * documented on `CURRENT_TOKEN_FLAG` in `completion/types`.
 *
 * Two hard rules, both of which shape the implementation:
 *
 *  1. **Only candidates reach stdout.** Anything else lands in the user's suggestion list.
 *  2. **It never fails.** Any error is swallowed and the exit code is always 0 — a completion bug
 *     must not paint a stack trace over someone's prompt mid-keystroke.
 *
 * Rule 1 is also why `run` is overridden rather than `handle` implemented: going through
 * `CommandParser` would let the inherited `--help` flag fire while the user is completing
 * `cmd --he<TAB>`, dumping the help screen into the candidate list.
 *
 * A host CLI whose startup is dominated by loading command modules should not route keypresses
 * through here — it should snapshot {@link commandSpecs} and call `resolveCompletion` directly,
 * skipping command discovery unless a dynamic slot demands it.
 */
export default class CompleteCommand extends Command {
	static command = COMPLETE_COMMAND;
	static description = 'Internal: resolve completion candidates for a partial command line';
	static hidden = true;

	constructor(private opts: CompleteCommandOptions) {
		super();
	}

	async run(runOpts: CommandRunOption): Promise<number> {
		this.logger = runOpts.logger;

		try {
			if (!Array.isArray(runOpts.args)) return 0;

			const request = parseCompletionRequest(runOpts.args);
			if (!request || !isImplemented(request.shell)) return 0;

			const registry = this.opts.commandRegistry;
			const candidates = await resolveCompletion({
				specs: commandSpecs(registry),
				words: request.words,
				ctx: runOpts.ctx,
				// Commands are already loaded in this path, so resolving a dynamic slot is just a lookup.
				loadCommand: name => registry.findCommand(name),
			});

			const output = encodeCandidates(request.shell, candidates);
			if (output) this.logger.log(output);
		} catch {
			// Deliberately silent — see the class docblock.
		}

		return 0;
	}

	/** Unreachable: `run` is overridden, so the parser that would call this never engages. */
	protected async handle(): Promise<void> {}
}
