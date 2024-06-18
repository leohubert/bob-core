import { CommandRegistry } from "./CommandRegistry";
import {Command} from "./Command";
import HelpCommand from "./commands/HelpCommand";
import {ExceptionHandler} from "./ExceptionHandler";

export class Cli {

    public readonly commandRegistry: CommandRegistry;
    private readonly exceptionHandler: ExceptionHandler

    get CommandRegistryClass() {
        return CommandRegistry;
    }

    get HelpCommandClass() {
        return HelpCommand;
    }

    get ExceptionHandlerClass() {
        return ExceptionHandler;
    }

    constructor() {
        this.commandRegistry = new this.CommandRegistryClass();
        this.exceptionHandler = new this.ExceptionHandlerClass();
        this.registerCommand(new this.HelpCommandClass(this.commandRegistry));
    }

    async loadCommandsPath(commandsPath: string) {
        await this.commandRegistry.loadCommandsPath(commandsPath);
    }

    registerCommand(command: Command) {
        this.commandRegistry.registerCommand(command)
    }

    async runCommand(command: string, ...args: any[]) {
        return await this.commandRegistry.runCommand(command, ...args)
            .catch(this.exceptionHandler.handle);
    }
}