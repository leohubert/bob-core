import * as fs from "node:fs";
import path from "path";
import * as SS from "string-similarity";
import chalk from "chalk";

import { LegacyCommand } from "@/src/LegacyCommand.js";
import {CommandNotFoundError} from "@/src/errors/CommandNotFoundError.js";
import {CommandIO} from "@/src/CommandIO.js";
import {Command} from "@/src/Command.js";

export type CommandResolver = (path: string) => Promise<Command>;

export class CommandRegistry {
    private readonly commands: Record<string, Command> = {};
	protected readonly io!: CommandIO;

    get commandSuffix() {
        return "Command";
    }

	protected get CommandIOClass(): typeof CommandIO {
		return CommandIO;
	}

    constructor() {
		this.io = new this.CommandIOClass();
    }

    getAvailableCommands(): string[] {
        return Object.keys(this.commands)
    }

    getCommands(): Array<LegacyCommand|Command> {
        return Object.values(this.commands)
    }


    private commandResolver: CommandResolver = async (path: string)=> {
        let defaultImport = (await import(path)).default
        if (!defaultImport) {
			throw new Error(`The command at path ${path} does not have a default export.`)
	    }

		if (defaultImport?.default) {
			defaultImport = defaultImport.default
		}

        let command: Command
        if (typeof defaultImport === 'function') {
			command = new defaultImport();
	    } else if (defaultImport instanceof Command) {
			command = defaultImport;
        } else {
			throw new Error(`The command at path ${path} is not a valid command class.`)
        }

        return command;
    }

    setCommandResolver(resolver: CommandResolver) {
        this.commandResolver = resolver;
    }

    registerCommand(command: Command, force: boolean = false) {
		const commandName = command.command;
        if (!commandName) {
            throw new Error('Command signature is invalid, it must have a command name.')
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

                this.registerCommand(command)

            } catch (e) {
                throw new Error(`Command ${file} failed to load. ${e}`, {
					cause: e
                })
            }
        }
    }

    async runCommand(ctx: any, command: string|LegacyCommand|Command, ...args: any[]): Promise<number> {
        const commandToRun: LegacyCommand|Command = typeof command === 'string' ? this.commands[command] : command;
        const commandSignature = typeof command === 'string' ? command : commandToRun.command;

        if (!commandToRun) {
			const suggestedCommand = await this.suggestCommand(commandSignature);
            if (suggestedCommand) {
                return await this.runCommand(ctx, suggestedCommand, ...args);
            }
            return 1;
        }

	    return await commandToRun.run(ctx, {
		    args
	    }) ?? 0;
    }

    private async suggestCommand(command: string): Promise<string | null> {
        const availableCommands = this.getAvailableCommands()
        const {bestMatch, bestMatchIndex, ratings} = SS.findBestMatch(command, availableCommands)
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
			console.log(chalk`{bgRed  ERROR } Command {yellow ${command}} not found.\n`)

			const commandToRun = await this.io.askForSelect(
				chalk`{green Did you mean to run one of these commands instead?}`,
				similarCommands,
			);
			if (commandToRun) {
				return commandToRun;
			}
		}

        throw new CommandNotFoundError(command);
    }

    private async askRunSimilarCommand(command: string, commandToAsk: string): Promise<boolean> {
	    console.log(chalk`{bgRed  ERROR } Command {yellow ${command}} not found.\n`)

	    return this.io.askForConfirmation(chalk`{green Do you want to run {yellow ${commandToAsk}} instead?} `);
    }

    private async* listCommandsFiles(
        basePath: string
    ): AsyncIterableIterator<string> {
        const dirEntry = fs.readdirSync(basePath, { withFileTypes: true })
        for (const dirent of dirEntry) {
            const direntPath = path.resolve(basePath, dirent.name);
            if (dirent.isDirectory()) {
                yield* this.listCommandsFiles(path.resolve(basePath, dirent.name));
            } else {
                // if (!direntPath.endsWith(`${this.commandSuffix}.ts`) && !direntPath.endsWith(`${this.commandSuffix}.js`)) {
                //     continue
                // }
                yield direntPath;
            }
        }
    }
}