import { Command, CommandRunOption } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { parseCompletionRequest } from '@/src/completion/complete.js';
import { encodeFishCandidates } from '@/src/completion/fish.js';
import { resolveCompletion } from '@/src/completion/resolve.js';
import { CommandSpec, commandSpecs } from '@/src/completion/specs.js';
import { COMPLETE_COMMAND } from '@/src/completion/types.js';

export type CompleteCommandOptions = {
	commandRegistry: CommandRegistry;
	/**
	 * Where the command metadata comes from. Defaults to snapshotting the live registry, which means
	 * hydrating it first; a cache-backed source is what keeps a keypress from importing anything.
	 */
	specs?: () => Promise<CommandSpec[]> | CommandSpec[];
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
			if (!request) return 0;

			const registry = this.opts.commandRegistry;
			const candidates = await resolveCompletion({
				specs: await (this.opts.specs ? this.opts.specs() : this.liveSpecs()),
				words: request.words,
				ctx: runOpts.ctx,
				// Only reached when the slot under the cursor has live values, so the common keypress
				// never triggers the hydration this needs.
				loadCommand: async name => {
					await registry.ensureLoaded();

					return registry.findCommand(name);
				},
			});

			const output = encodeFishCandidates(candidates);
			if (output) this.logger.log(output);
		} catch {
			// Deliberately silent — see the class docblock.
		}

		return 0;
	}

	private async liveSpecs(): Promise<CommandSpec[]> {
		await this.opts.commandRegistry.ensureLoaded();

		return commandSpecs(this.opts.commandRegistry);
	}

	/** Unreachable: `run` is overridden, so the parser that would call this never engages. */
	protected async handle(): Promise<void> {}
}
