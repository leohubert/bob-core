import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { Command } from '@/src/Command.js';
import { Logger } from '@/src/Logger.js';
import { StringSimilarity } from '@/src/StringSimilarity.js';
import { CommandNotFoundError } from '@/src/errors/CommandNotFoundError.js';
import { isBobCommandClass } from '@/src/lib/helpers.js';
import { ContextDefinition } from '@/src/lib/types.js';
import { UX } from '@/src/ux/index.js';

export type CommandResolver = (path: string) => Promise<typeof Command | null>;
export type FileImporter = (filePath: string) => Promise<unknown>;

const AUTO_SUGGEST_THRESHOLD = 0.75;
const LIST_SUGGEST_THRESHOLD = 0.55;
const NEAR_TIE_GAP = 0.05;

export type CommandRegistryOptions = {
	logger?: Logger;
	ux?: UX;
	stringSimilarity?: StringSimilarity;
};

export class CommandRegistry {
	private readonly commands: Record<string, typeof Command> = {};
	private readonly aliases: Record<string, string> = {};
	protected readonly ux: UX;
	protected readonly logger: Logger;
	private readonly stringSimilarity: StringSimilarity;

	constructor(opts?: CommandRegistryOptions) {
		this.logger = opts?.logger ?? new Logger();
		this.ux = opts?.ux ?? new UX();
		this.stringSimilarity = opts?.stringSimilarity ?? new StringSimilarity();
	}

	getAvailableCommands(): string[] {
		return [...Object.keys(this.commands), ...Object.keys(this.aliases)];
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

		if (!force && this.aliases[commandName]) {
			throw new Error(`Command name ${commandName} conflicts with an existing alias.`);
		}

		this.commands[commandName] = command;

		for (const alias of command.aliases) {
			if (!force && this.commands[alias]) {
				throw new Error(`Alias ${alias} conflicts with an existing command name.`);
			}
			if (!force && this.aliases[alias]) {
				throw new Error(`Alias ${alias} already registered.`);
			}
			this.aliases[alias] = commandName;
		}
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
			const CommandClass = this.commands[command] ?? this.commands[this.aliases[command]];
			if (!CommandClass) {
				const suggestedCommand = await this.suggestCommand(command);
				if (suggestedCommand) {
					return await this.runCommand(ctx, suggestedCommand, ...args);
				}
				throw new CommandNotFoundError(command);
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

	/**
	 * Looks for a similarly-named command and offers it to the user via prompts.
	 * Returns the resolved command name, or `null` for both "no match" and
	 * "user cancelled / declined the suggestion" — the caller throws
	 * {@link CommandNotFoundError} on `null`. Cancellation is logged at debug
	 * level so it's still distinguishable from "no match" in verbose output.
	 */
	private async suggestCommand(command: string): Promise<string | null> {
		const availableCommands = this.getAvailableCommands();
		if (availableCommands.length === 0) return null;

		const { bestMatch, bestMatchIndex, ratings } = this.stringSimilarity.findBestMatch(command, availableCommands);
		const sorted = [...ratings].sort((a, b) => b.rating - a.rating);
		const runnerUp = sorted[1]?.rating ?? 0;
		const similarCommands = sorted.filter(r => r.rating >= LIST_SUGGEST_THRESHOLD).map(r => r.target);

		const isClearWinner = bestMatch && bestMatch.rating >= AUTO_SUGGEST_THRESHOLD && bestMatch.rating - runnerUp > NEAR_TIE_GAP;

		if (isClearWinner) {
			const commandToAsk = availableCommands[bestMatchIndex];
			const accepted = await this.askRunSimilarCommand(command, commandToAsk);
			if (accepted === true) return commandToAsk;
			if (accepted === null) this.logger.debug(`suggestion prompt cancelled for "${command}"`);
			return null;
		}

		if (similarCommands.length === 1) {
			const commandToAsk = similarCommands[0];
			const accepted = await this.askRunSimilarCommand(command, commandToAsk);
			if (accepted === true) return commandToAsk;
			if (accepted === null) this.logger.debug(`suggestion prompt cancelled for "${command}"`);
			return null;
		}

		if (similarCommands.length > 1) {
			const commandToRun = await this.ux.askForSelect(
				`${chalk.red('unknown command')} ${chalk.bold.yellow(`'${command}'`)} ${chalk.dim('—')} did you mean one of these?`,
				similarCommands,
			);
			if (commandToRun) return commandToRun;
			if (commandToRun === null) this.logger.debug(`suggestion selection cancelled for "${command}"`);
			return null;
		}

		return null;
	}

	private async askRunSimilarCommand(command: string, commandToAsk: string): Promise<boolean | null> {
		return this.ux.askForConfirmation(
			`${chalk.red('unknown command')} ${chalk.bold.yellow(`'${command}'`)} ${chalk.dim('—')} did you mean ${chalk.bold.green(`'${commandToAsk}'`)}?`,
		);
	}

	/**
	 * Recursively yields every importable command file under `basePath`. Errors
	 * from `readdir` are wrapped with the offending path so partial loads
	 * surface a clear cause instead of a bare "ENOENT" / "EACCES".
	 */
	private async *listCommandsFiles(basePath: string): AsyncIterableIterator<string> {
		let dirEntry: fs.Dirent[];
		try {
			dirEntry = await fs.promises.readdir(basePath, { withFileTypes: true });
		} catch (e) {
			throw new Error(`Failed to read commands directory "${basePath}": ${(e as Error).message}`, { cause: e });
		}
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
