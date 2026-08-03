import path from 'node:path';

import { Command } from '@/src/Command.js';
import { CommandRegistry, CommandRegistryOptions, CommandResolver, FileImporter } from '@/src/CommandRegistry.js';
import { ExceptionHandler } from '@/src/ExceptionHandler.js';
import { Logger } from '@/src/Logger.js';
import CompleteCommand, { CompleteCommandOptions } from '@/src/commands/CompleteCommand.js';
import CompletionCommand, { CompletionCommandOptions } from '@/src/commands/CompletionCommand.js';
import HelpCommand, { HelpCommandOptions } from '@/src/commands/HelpCommand.js';
import { ContextDefinition } from '@/src/lib/types.js';

/**
 * Best effort at "what did the user type to get here". Correct for a node script and for a
 * single-file compiled binary; hosts that rename or wrap their entry point should pass `binName`.
 */
function defaultBinName(): string {
	const entry = process.argv[1] ?? process.argv[0] ?? 'cli';

	return path.basename(entry, path.extname(entry));
}

export type CliOptions<C extends ContextDefinition = ContextDefinition> = {
	ctx?: C;
	name?: string;
	version?: string;
	logger?: Logger;
	/**
	 * The executable name as users type it, e.g. `bdg`. Distinct from `name`, which is the
	 * human-facing title shown in help. Used by the generated completion scripts, which must call
	 * the binary by its real name. Defaults to the basename of the running script.
	 */
	binName?: string;
};

/**
 * CLI host. Wires together a {@link CommandRegistry}, {@link ExceptionHandler},
 * and the built-in {@link HelpCommand}, and provides the entry point used by
 * binaries to dispatch a command.
 *
 * The `C` generic threads a typed application context through to every command
 * registered with the CLI.
 */
export class Cli<C extends ContextDefinition = ContextDefinition> {
	private readonly ctx?: C;
	private readonly logger: Logger;

	public readonly commandRegistry: CommandRegistry;
	private readonly exceptionHandler: ExceptionHandler;

	private readonly helpCommand: Command;

	protected newCommandRegistry(opts: CommandRegistryOptions) {
		return new CommandRegistry(opts);
	}

	protected newHelpCommand(opts: HelpCommandOptions) {
		return new HelpCommand(opts);
	}

	protected newCompletionCommand(opts: CompletionCommandOptions) {
		return new CompletionCommand(opts);
	}

	protected newCompleteCommand(opts: CompleteCommandOptions) {
		return new CompleteCommand(opts);
	}

	protected newExceptionHandler(opts: { logger: Logger }) {
		return new ExceptionHandler(opts.logger);
	}

	constructor(opts: CliOptions<C> = {}) {
		this.ctx = opts.ctx;
		this.logger = opts.logger ?? new Logger();
		this.commandRegistry = this.newCommandRegistry({
			logger: this.logger,
		});
		this.exceptionHandler = this.newExceptionHandler({
			logger: this.logger,
		});
		this.helpCommand = this.newHelpCommand({
			cliName: opts.name,
			cliVersion: opts.version,
			commandRegistry: this.commandRegistry,
		});

		// Registered so they resolve by name like any other command — `help`, `completion fish`,
		// and the hidden endpoint the generated completion scripts call.
		const binName = opts.binName ?? defaultBinName();
		this.commandRegistry.registerBuiltInCommand(this.helpCommand);
		this.commandRegistry.registerBuiltInCommand(this.newCompletionCommand({ binName }));
		this.commandRegistry.registerBuiltInCommand(this.newCompleteCommand({ commandRegistry: this.commandRegistry }));
	}

	/** Registers a custom resolver used by `loadCommandsPath` to import command modules. */
	withCommandResolver(resolver: CommandResolver) {
		this.commandRegistry.withCommandResolver(resolver);
		return this;
	}

	/** Overrides how command files are imported (useful for tests / virtual filesystems). */
	withFileImporter(importer: FileImporter) {
		this.commandRegistry.withFileImporter(importer);
		return this;
	}

	/**
	 * Registers commands by class, instance, or directory path. String args are
	 * treated as filesystem paths and walked via the registry's resolver.
	 */
	async withCommands(...commands: Array<typeof Command<C> | Command<C> | string>) {
		for (const command of commands) {
			if (typeof command === 'string') {
				await this.commandRegistry.loadCommandsPath(command);
			} else if (typeof command === 'function') {
				this.registerCommand(command);
			} else {
				this.registerCommand(command.constructor as typeof Command);
			}
		}
	}

	/**
	 * Resolves and runs a command. Bob errors are formatted by the
	 * {@link ExceptionHandler} and yield a non-zero exit code; non-Bob errors
	 * propagate so they remain visible in stack traces. Returns the exit code.
	 */
	async runCommand(command: string | typeof Command | Command | undefined, ...args: string[]): Promise<number> {
		if (!command) {
			return await this.runHelpCommand();
		}

		return await this.commandRegistry.runCommand(this.ctx ?? {}, command, ...args).catch(this.exceptionHandler.handle.bind(this.exceptionHandler));
	}

	/** Convenience entry point that prints help with the registered commands. */
	async runHelpCommand(): Promise<number> {
		return await this.runCommand(this.helpCommand);
	}

	protected registerCommand(command: typeof Command<C>) {
		this.commandRegistry.registerCommand(command);
	}
}
