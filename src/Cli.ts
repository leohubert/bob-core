import { CommandRegistry } from "./CommandRegistry";
import {Command} from "./Command";
import HelpCommand from "./commands/HelpCommand";
import {ExceptionHandler} from "./ExceptionHandler";

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

    constructor(ctx?: C) {
        this.ctx = ctx;
        this.commandRegistry = new this.CommandRegistryClass();
        this.exceptionHandler = new this.ExceptionHandlerClass();
        this.helpCommand = new this.HelpCommandClass(this.commandRegistry);
        this.registerCommand(this.helpCommand);
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

    async runCommand(command: string, ...args: any[]) {
        return await this.commandRegistry.runCommand(this.ctx, command, ...args)
            .catch(this.exceptionHandler.handle);
    }

    async runHelpCommand() {
        return await this.runCommand(this.helpCommand.command)
    }

    protected registerCommand(command: Command<C>) {
        this.commandRegistry.registerCommand(command)
    }
}