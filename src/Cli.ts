import {CommandRegistry} from "@/src/CommandRegistry.js";
import HelpCommand, {HelpCommandOptions} from "@/src/commands/HelpCommand.js";
import {ExceptionHandler} from "@/src/ExceptionHandler.js";
import {Command} from "@/src/Command.js";
import {Logger, LoggerOptions} from "@/src/Logger.js";

export type CliOptions<C> = {
	ctx?: C;
	name?: string;
	version?: string;
	logger?: Logger;
	loggerOptions?: LoggerOptions;
}

export class Cli<C> {

	private readonly ctx?: C;
	public readonly logger: Logger;

	public readonly commandRegistry: CommandRegistry;
	private readonly exceptionHandler: ExceptionHandler

	private readonly helpCommand: Command;

	protected newCommandRegistry(opts: {
		logger: Logger
	}) {
		return new CommandRegistry(opts.logger);
	}

	protected newHelpCommand(opts: HelpCommandOptions) {
		return new HelpCommand(opts);
	}

	protected newExceptionHandler(opts: {
		logger: Logger
	}) {
		return new ExceptionHandler(opts.logger);
	}

	constructor(opts: CliOptions<C> = {}) {
		this.ctx = opts.ctx;
		this.logger = opts.logger ?? new Logger(opts.loggerOptions);
		this.commandRegistry = this.newCommandRegistry({
			logger: this.logger
		});
		this.exceptionHandler = this.newExceptionHandler({
			logger: this.logger
		});
		this.helpCommand = this.newHelpCommand({
			cliName: opts.name,
			cliVersion: opts.version,
			commandRegistry: this.commandRegistry
		});
	}

	setCommandResolver(resolver: (path: string) => Promise<Command<C>>) {
		this.commandRegistry.setCommandResolver(resolver);
	}

	async withCommands(...commands: Array<Command<C> | { new(): Command<C> } | string>) {
		for (const command of commands) {
			if (typeof command === 'string') {
				await this.commandRegistry.loadCommandsPath(command);
			} else {
				if (typeof command === 'function') {
					this.registerCommand(new command())
				} else {
					this.registerCommand(command)
				}
			}
		}
	}

	async runCommand(command: string | Command | undefined, ...args: any[]): Promise<number> {
		if (!command) {
			return await this.runHelpCommand()
		}

		return await this.commandRegistry.runCommand(this.ctx, command, ...args)
			.catch(this.exceptionHandler.handle.bind(this.exceptionHandler));
	}

	async runHelpCommand(): Promise<number> {
		return await this.runCommand(this.helpCommand)
	}

	protected registerCommand(command: Command<C>) {
		this.commandRegistry.registerCommand(command)
	}
}