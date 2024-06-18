import { CommandRegistry } from "./CommandRegistry";
import {Command} from "./Command";
import HelpCommand from "./commands/HelpCommand";

export class Cli {

    public readonly commandRegistry: CommandRegistry;

    get CommandRegistryClass() {
        return CommandRegistry;
    }

    get HelpCommandClass() {
        return HelpCommand;
    }

    constructor() {
        this.commandRegistry = new this.CommandRegistryClass();
        this.registerCommand(new this.HelpCommandClass(this.commandRegistry));
    }

    async loadCommandsPath(commandsPath: string) {
        await this.commandRegistry.loadCommandsPath(commandsPath);
    }

    registerCommand(command: Command) {
        this.commandRegistry.registerCommand(command)
    }

    async runCommand(command: string, ...args: any[]) {
        await this.commandRegistry.runCommand(command, ...args);
    }
}