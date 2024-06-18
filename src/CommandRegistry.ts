import path from "path";
import { Command } from "./Command";
import * as fs from "node:fs";
import {CommandNotFoundError} from "./errors/CommandNotFoundError";

export class CommandRegistry {
    private readonly commands: Record<string, Command> = {};

    get commandSuffix() {
        return "Command.ts";
    }

    constructor() {}

    getAvailableCommands(): string[] {
        return Object.keys(this.commands)
    }

    getCommands(): Command[] {
        return Object.values(this.commands)
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
            let CommandClass: { new(): Command };

            try {
                CommandClass = (await import(file)).default as {
                    new(): Command;
                };
            } catch (e) {
                console.error(`Failed to load command ${file}. ${e}`);
                continue;
            }

            try {
                const command = new CommandClass();

                this.registerCommand(command)

            } catch (e) {
                throw new Error(`Command ${file} failed to launch.`);
            }
        }
    }

    async runCommand(ctx: any, command: string, ...args: any[]) {
        const commandToRun: Command = this.commands[command];

        if (!this.commands[command]) {
            throw new CommandNotFoundError(command, this.getAvailableCommands());
        }

        return await commandToRun.run(ctx, ...args);
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
                if (!direntPath.endsWith(this.commandSuffix)) {
                    continue
                }
                yield direntPath;
            }
        }
    }
}