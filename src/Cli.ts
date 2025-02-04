import { CommandRegistry } from "@/src/CommandRegistry.js";
import {Command} from "@/src/Command.js";
import HelpCommand from "@/src/commands/HelpCommand.js";
import {ExceptionHandler} from "@/src/ExceptionHandler.js";

export type CliOptions<C> = {
    ctx?: C;
    name?: string;
    version?: string;
}

export class Cli<C> {

    public readonly commandRegistry: CommandRegistry;
    private readonly exceptionHandler: ExceptionHandler
    private readonly ctx?: C;

    private readonly helpCommand: HelpCommand;

    get CommandRegistryClass() {
        return CommandRegistry;
    }

    get HelpCommandClass() {
        return HelpCommand;
    }

    get ExceptionHandlerClass() {
        return ExceptionHandler;
    }

    constructor(opts: CliOptions<C> = {}) {
        this.ctx = opts.ctx;
        this.commandRegistry = new this.CommandRegistryClass();
        this.exceptionHandler = new this.ExceptionHandlerClass();
        this.helpCommand = new this.HelpCommandClass({
            cliName: opts.name,
            cliVersion: opts.version,
            commandRegistry: this.commandRegistry
        });
    }

    setCommandResolver(resolver: (path: string) => Promise<Command<C>>) {
        this.commandRegistry.setCommandResolver(resolver);
    }

    async withCommands(...commands: Array<Command<C> | { new (): Command<C> } | string>) {
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

    async runCommand(command: string|Command, ...args: any[]): Promise<number> {
        if (!command) {
            return await this.runHelpCommand()
        }

        return await this.commandRegistry.runCommand(this.ctx, command, ...args)
            .catch(this.exceptionHandler.handle);
    }

    async runHelpCommand(): Promise<number> {
        return await this.runCommand(this.helpCommand)
    }

    protected registerCommand(command: Command<C>) {
        this.commandRegistry.registerCommand(command)
    }
}