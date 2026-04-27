import { CommandParser } from '@/src/CommandParser.js';
import { HelpCommandFlag } from '@/src/HelpFlag.js';
import { Logger } from '@/src/Logger.js';
import { ArgsSchema, ContextDefinition, FlagOpts, FlagsSchema, Parsed } from '@/src/lib/types.js';
import { UX } from '@/src/ux/index.js';

export type CommandRunExample = {
	description: string;
	command: string;
};

export type CommandRunOption<C = ContextDefinition> = {
	logger: Logger;
	ctx: C;
} & (
	| {
			args: string[];
	  }
	| {
			args: Record<string, any>;
			flags: Record<string, any>;
	  }
);

/**
 * Base class for declarative commands.
 *
 * Subclasses set static metadata (`command`, `description`, `args`, `flags`,
 * `examples`, `aliases`, `group`, `hidden`) and implement `handle(ctx, parsed)`.
 * The framework parses argv, validates against `args`/`flags`, optionally
 * prompts for missing required values, then invokes `preHandle` (if defined)
 * and finally `handle`.
 *
 * The `C` generic threads a typed application context through to `handle`.
 */
export abstract class Command<C extends ContextDefinition = ContextDefinition> {
	/** Discriminator used by `isBobCommandClass` for `instanceof`-free checks. */
	static $type = 'BobCommand' as const;

	/** Canonical command name typed at the CLI (e.g. `"deploy"`, `"db:migrate"`). */
	static command: string = '';
	/** One-line description rendered in `help`. */
	static description: string = '';
	/** Optional grouping label for the help screen — defaults to the prefix before `:` if any. */
	static group?: string;
	/** Positional argument schema (use `Args.*` builders). */
	static args: ArgsSchema = {};
	/** Named flag schema (use `Flags.*` builders). */
	static flags: FlagsSchema = {};
	/** Example invocations rendered in `--help`. */
	static examples: CommandRunExample[] = [];
	/** When true, the command is omitted from the help index but still runnable. */
	static hidden: boolean = false;
	/** Alternative names that resolve to this command. */
	static aliases: string[] = [];

	/** When true, `baseFlags` (including `--help`) are not auto-merged. */
	static disableDefaultOptions: boolean = false;
	/** When true, missing required values will not trigger interactive prompts. */
	static disablePrompting: boolean = false;
	/** When true, unknown flags are accepted instead of throwing `InvalidFlag`. */
	static allowUnknownFlags: boolean = false;
	/** When true, extra positional arguments throw `TooManyArguments`. */
	static strictMode: boolean = false;

	protected ctx!: C;
	protected logger!: Logger;
	protected ux!: UX;
	protected parser!: CommandParser<FlagsSchema, ArgsSchema>;

	/**
	 * Optional pre-handler hook. Returning a non-zero number short-circuits
	 * execution and is propagated as the command's exit code.
	 */
	protected preHandle?(): Promise<void | number>;

	/**
	 * Main entry point. Receives the typed context and the parsed flags/args.
	 * Returning a number sets the exit code; void/undefined is treated as 0.
	 */
	protected abstract handle(ctx: C, parsed: Parsed<any>): Promise<number | void> | number | void;

	/** Flags merged into every command's flag schema (`--help` by default). */
	static baseFlags: FlagsSchema = {
		help: HelpCommandFlag,
	};

	protected newCommandParser(opts: {
		flags: FlagsSchema;
		args: ArgsSchema;
		ctx: ContextDefinition;
		ux: UX;
		cmd: typeof Command;
	}): CommandParser<FlagsSchema, ArgsSchema> {
		return new CommandParser({
			ux: opts.ux,
			ctx: opts.ctx,
			flags: opts.flags,
			args: opts.args,
			cmd: opts.cmd,
		});
	}

	protected newUX(): UX {
		return new UX();
	}

	/**
	 * Runs the command lifecycle. Resolves to the exit code:
	 *   - `0` — success (or `void` from `handle`)
	 *   - returned number from `preHandle` / `handle` for early exits
	 *   - `0` for flag-handler short-circuits like `--help`
	 *
	 * Either parses raw `args: string[]` or accepts pre-parsed `flags`/`args`
	 * objects (used internally to invoke commands programmatically without
	 * re-running the parser).
	 */
	async run(runOpts: CommandRunOption<C>): Promise<number | void> {
		const ctor = this.constructor as typeof Command;

		this.ctx = runOpts.ctx;
		this.logger = runOpts.logger;
		this.ux = this.newUX();

		let handlerInput: { flags: Record<string, any>; args: Record<string, any> };

		if (!('flags' in runOpts)) {
			this.parser = this.newCommandParser({
				ctx: this.ctx,
				ux: this.ux,
				flags: ctor.disableDefaultOptions ? ctor.flags : { ...ctor.baseFlags, ...ctor.flags },
				args: ctor.args,
				cmd: ctor,
			});

			if (ctor.allowUnknownFlags) {
				this.parser.allowUnknownFlags();
			}
			if (ctor.strictMode) {
				this.parser.strictMode();
			}

			if (ctor.disablePrompting) {
				this.parser.disablePrompting();
			}

			const parsed = await this.parser.init(runOpts.args);

			for (const flag in parsed.flags) {
				const value: any = parsed.flags[flag];
				const definition = ctor.flags[flag] || ctor.baseFlags[flag];

				if (definition && definition.handler) {
					const flagOpts: FlagOpts = { name: flag, ux: this.ux, ctx: runOpts.ctx, definition, cmd: ctor };
					const res = definition.handler(value as never, flagOpts);
					if (res && res.shouldStop) {
						return 0;
					}
				}
			}

			await this.parser.validate();

			handlerInput = {
				flags: parsed.flags,
				args: parsed.args,
			};
		} else {
			handlerInput = {
				flags: runOpts.flags,
				args: runOpts.args,
			};
		}

		if (this.preHandle) {
			const preHandleResult = await this.preHandle();
			if (preHandleResult && preHandleResult !== 0) {
				return preHandleResult;
			}
		}

		const res = await this.handle(this.ctx, handlerInput);
		return res ?? 0;
	}
}
