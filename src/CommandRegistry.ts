import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { Command } from '@/src/Command.js';
import { Logger } from '@/src/Logger.js';
import { StringSimilarity } from '@/src/StringSimilarity.js';
import { UX } from '@/src/ux/index.js';
import { CommandNotFoundError } from '@/src/errors/CommandNotFoundError.js';
import { isBobCommandClass } from '@/src/lib/helpers.js';
import { ContextDefinition } from '@/src/lib/types.js';

export type CommandResolver = (path: string) => Promise<typeof Command | null>;
export type FileImporter = (filePath: string) => Promise<unknown>;

export type CommandRegistryOptions = {
	logger?: Logger;
	ux?: UX;
	stringSimilarity?: StringSimilarity;
};

export class CommandRegistry {
	private readonly commands: Record<string, typeof Command> = {};
	protected readonly ux: UX;
	protected readonly logger: Logger;
	private readonly stringSimilarity: StringSimilarity;

	constructor(opts?: CommandRegistryOptions) {
		this.logger = opts?.logger ?? new Logger();
		this.ux = opts?.ux ?? new UX();
		this.stringSimilarity = opts?.stringSimilarity ?? new StringSimilarity();
	}

	getAvailableCommands(): string[] {
		return Object.keys(this.commands);
	}

	getCommands(): Array<typeof Command> {
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

		if (typeof defaultImport === 'function' && isBobCommandClass(defaultImport)) {
			return defaultImport as typeof Command;
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

	registerCommand(command: typeof Command<any>, force: boolean = false) {
		if (!isBobCommandClass(command)) {
			throw new Error('Invalid command, it must extend the Command class.');
		}

		const commandName = command.command;
		if (!commandName) {
			throw new Error(`Cannot register a command with no name. ${command.name} `);
		}

		if (!force && this.commands[commandName]) {
			throw new Error(`Command ${commandName} already registered.`);
		}
		this.commands[commandName] = command;
	}

	async loadCommandsPath(commandsPath: string) {
		for await (const file of this.listCommandsFiles(commandsPath)) {
			try {
				const command = await this.commandResolver(file);

				if (isBobCommandClass(command)) {
					this.registerCommand(command);
				}
			} catch (e) {
				throw new Error(`Command ${file} failed to load. ${e}`, {
					cause: e,
				});
			}
		}
	}

	async runCommand(ctx: ContextDefinition, command: string | typeof Command | Command, ...args: string[]): Promise<number> {
		let commandInstance: Command;

		if (typeof command === 'string') {
			const CommandClass = this.commands[command];
			if (!CommandClass) {
				const suggestedCommand = await this.suggestCommand(command);
				if (suggestedCommand) {
					return await this.runCommand(ctx, suggestedCommand, ...args);
				}
				return 1;
			}
			commandInstance = new (CommandClass as unknown as new () => Command)();
		} else if (isBobCommandClass(command)) {
			commandInstance = new (command as unknown as new () => Command)();
		} else {
			commandInstance = command;
		}

		return (
			(await commandInstance.run({
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

		if (bestMatch && ((bestMatch.rating > 0 && similarCommands.length <= 1) || (bestMatch.rating > 0.7 && similarCommands.length > 1))) {
			const commandToAsk = availableCommands[bestMatchIndex];
			const runCommand = await this.askRunSimilarCommand(command, commandToAsk);
			if (runCommand) {
				return commandToAsk;
			} else {
				return null;
			}
		}

		if (similarCommands.length) {
			this.logger.error(`${chalk.bgRed(' ERROR ')} Command ${chalk.yellow(command)} not found.\n`);

			const commandToRun = await this.ux.askForSelect(chalk.green('Did you mean to run one of these commands instead?'), similarCommands);
			if (commandToRun) {
				return commandToRun;
			}
		}

		throw new CommandNotFoundError(command);
	}

	private async askRunSimilarCommand(command: string, commandToAsk: string): Promise<boolean> {
		this.logger.error(`${chalk.bgRed(' ERROR ')} Command ${chalk.yellow(command)} not found.\n`);

		return this.ux.askForConfirmation(`${chalk.green(`Do you want to run ${chalk.yellow(commandToAsk)} instead?`)} `);
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
