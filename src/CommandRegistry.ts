import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { Command } from '@/src/Command.js';
import { CommandIO, CommandIOOptions } from '@/src/CommandIO.js';
import { Logger } from '@/src/Logger.js';
import { StringSimilarity } from '@/src/StringSimilarity.js';
import { CommandNotFoundError } from '@/src/errors/CommandNotFoundError.js';
import { ArgumentsSchema, ContextDefinition, OptionsSchema } from '@/src/lib/types.js';

export type CommandResolver = (path: string) => Promise<Command | null>;
export type FileImporter = (filePath: string) => Promise<unknown>;

export type CommandRegistryOptions = {
	logger?: Logger;
	stringSimilarity?: StringSimilarity;
};

export class CommandRegistry {
	private readonly commands: Record<string, Command<ContextDefinition, OptionsSchema, OptionsSchema>> = {};
	protected readonly io!: CommandIO;
	protected readonly logger: Logger;
	private readonly stringSimilarity: StringSimilarity;

	protected newCommandIO(opts: CommandIOOptions): CommandIO {
		return new CommandIO(opts);
	}

	constructor(opts?: CommandRegistryOptions) {
		this.logger = opts?.logger ?? new Logger();
		this.io = this.newCommandIO({
			logger: this.logger,
		});
		this.stringSimilarity = opts?.stringSimilarity ?? new StringSimilarity();
	}

	getAvailableCommands(): string[] {
		return Object.keys(this.commands);
	}

	getCommands(): Array<Command> {
		return Object.values(this.commands);
	}

	private importFile: FileImporter = async (filePath: string): Promise<unknown> => {
		return (await import(filePath)).default;
	};

	private commandResolver: CommandResolver = async (path: string) => {
		let defaultImport = await this.importFile(path);
		if (!defaultImport) {
			return null;
		}

		if (defaultImport && typeof defaultImport === 'object' && 'default' in defaultImport) {
			defaultImport = (defaultImport as { default: any }).default;
		}

		if (typeof defaultImport === 'function') {
			return new (defaultImport as new () => Command)();
		} else if (defaultImport instanceof Command) {
			return defaultImport;
		}

		return null;
	};

	withCommandResolver(resolver: CommandResolver) {
		this.commandResolver = resolver;
		return this;
	}

	withFileImporter(importer: FileImporter) {
		this.importFile = importer;
		return this;
	}

	registerCommand<C extends ContextDefinition = ContextDefinition, Opts extends OptionsSchema = OptionsSchema, Args extends ArgumentsSchema = ArgumentsSchema>(
		command: Command<C, Opts, Args>,
		force: boolean = false,
	) {
		const commandName = command.command;
		if (!commandName) {
			throw new Error('Command signature is invalid, it must have a command name.');
		}

		if (!force && this.commands[commandName]) {
			throw new Error(`Command ${commandName} already registered.`);
		}
		this.commands[commandName] = command as Command<ContextDefinition, OptionsSchema, OptionsSchema>;
	}

	async loadCommandsPath(commandsPath: string) {
		for await (const file of this.listCommandsFiles(commandsPath)) {
			try {
				const command = await this.commandResolver(file);

				if (command instanceof Command) {
					this.registerCommand(command);
				}
			} catch (e) {
				throw new Error(`Command ${file} failed to load. ${e}`, {
					cause: e,
				});
			}
		}
	}

	async runCommand(ctx: ContextDefinition, command: string | Command, ...args: string[]): Promise<number> {
		const commandToRun: Command = typeof command === 'string' ? this.commands[command] : command;
		const commandSignature = typeof command === 'string' ? command : commandToRun.command;

		if (!commandToRun) {
			const suggestedCommand = await this.suggestCommand(commandSignature);
			if (suggestedCommand) {
				return await this.runCommand(ctx, suggestedCommand, ...args);
			}
			return 1;
		}

		return (
			(await commandToRun.run({
				ctx,
				logger: this.logger,
				args,
			})) ?? 0
		);
	}

	private async suggestCommand(command: string): Promise<string | null> {
		const availableCommands = this.getAvailableCommands();
		const { bestMatch, bestMatchIndex, ratings } = this.stringSimilarity.findBestMatch(command, availableCommands);
		const similarCommands = ratings.filter(r => r.rating > 0.3).map(r => r.target);

		if ((bestMatch.rating > 0 && similarCommands.length <= 1) || (bestMatch.rating > 0.7 && similarCommands.length > 1)) {
			const commandToAsk = availableCommands[bestMatchIndex];
			const runCommand = await this.askRunSimilarCommand(command, commandToAsk);
			if (runCommand) {
				return commandToAsk;
			} else {
				return null;
			}
		}

		if (similarCommands.length) {
			this.io.error(`${chalk.bgRed(' ERROR ')} Command ${chalk.yellow(command)} not found.\n`);

			const commandToRun = await this.io.askForSelect(chalk.green('Did you mean to run one of these commands instead?'), similarCommands);
			if (commandToRun) {
				return commandToRun;
			}
		}

		throw new CommandNotFoundError(command);
	}

	private async askRunSimilarCommand(command: string, commandToAsk: string): Promise<boolean> {
		this.io.error(`${chalk.bgRed(' ERROR ')} Command ${chalk.yellow(command)} not found.\n`);

		return this.io.askForConfirmation(`${chalk.green(`Do you want to run ${chalk.yellow(commandToAsk)} instead?`)} `);
	}

	private async *listCommandsFiles(basePath: string): AsyncIterableIterator<string> {
		const dirEntry = fs.readdirSync(basePath, { withFileTypes: true });
		for (const dirent of dirEntry) {
			const direntPath = path.resolve(basePath, dirent.name);
			if (dirent.isDirectory()) {
				yield* this.listCommandsFiles(path.resolve(basePath, dirent.name));
			} else {
				if (!direntPath.endsWith(`.ts`) && !direntPath.endsWith(`.js`) && !direntPath.endsWith(`.mjs`) && !direntPath.endsWith(`.cjs`)) {
					continue;
				}
				yield direntPath;
			}
		}
	}
}
