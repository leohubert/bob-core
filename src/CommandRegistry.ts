import path from "path";
import { Command } from "./Command";
import * as fs from "node:fs";
import {CommandNotFoundError} from "./errors/CommandNotFoundError";
import * as SS from "string-similarity";
import chalk from "chalk";
import {type} from "node:os";

export type CommandResolver = (path: string) => Promise<Command>;

export class CommandRegistry {
    private readonly commands: Record<string, Command> = {};

    get commandSuffix() {
        return "Command";
    }

    constructor() {}

    getAvailableCommands(): string[] {
        return Object.keys(this.commands)
    }

    getCommands(): Command[] {
        return Object.values(this.commands)
    }


    private commandResolver: CommandResolver = async (path: string) => {
        const CommandClass = (await import(path)).default

        let command: Command
        if (CommandClass?.default) {
            command = new CommandClass.default()
        } else {
            command = new CommandClass()
        }

        return command;
    }

    setCommandResolver(resolver: (path: string) => Promise<Command>) {
        this.commandResolver = resolver;
    }

    registerCommand(command: Command, force: boolean = false) {
        const commandName = command.signature.split(' ')[0]
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
                throw new Error(`Command ${file} failed to load. ${e}`)
            }
        }
    }

    async runCommand(ctx: any, command: string|Command, ...args: any[]): Promise<number> {
        const commandToRun: Command = typeof command === 'string' ? this.commands[command] : command;
        const commandSignature = typeof command === 'string' ? command : commandToRun.command;

        if (!commandToRun) {
            const suggestedCommand = await this.suggestCommand(commandSignature);
            if (suggestedCommand) {
                return await this.runCommand(ctx, suggestedCommand, ...args);
            }
            return 1;
        }

        return await commandToRun.run(ctx, ...args);
    }

    private async suggestCommand(command: string): Promise<string | null> {
        const availableCommands = this.getAvailableCommands()
        const similarCommands = SS.findBestMatch(command, availableCommands).ratings.filter(r => r.rating > 0.2).map(r => r.target);


        if (similarCommands.length === 1) {
            const commandToAsk = similarCommands[0];
            const runCommand = await this.askRunSimilarCommand(command, commandToAsk);
            if (runCommand) {
                return commandToAsk;
            } else {
                return null;
            }
        }

        throw new CommandNotFoundError(command, similarCommands);
    }

    private async askRunSimilarCommand(command: string, commandToAsk: string): Promise<boolean> {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log(chalk`  {bgRed  ERROR } Command {yellow ${command}} not found.\n`)
        return new Promise((resolve) => {
            readline.question(chalk`{green Do you want to run {yellow ${commandToAsk}} instead?} {white (yes/no)} [{yellow no}]\n > `, (answer: string) => {
                resolve(answer === 'yes' || answer === 'y');
                readline.close();
            });
        });
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
                if (!direntPath.endsWith(`${this.commandSuffix}.ts`) && !direntPath.endsWith(`${this.commandSuffix}.js`)) {
                    continue
                }
                yield direntPath;
            }
        }
    }
}