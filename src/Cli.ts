import { CommandRegistry } from "./CommandRegistry";
import {Command} from "./Command";

export class Cli {

    public readonly commandRegistry: CommandRegistry;

    get CommandRegistryClass() {
        return CommandRegistry;
    }

    constructor() {
        this.commandRegistry = new this.CommandRegistryClass();
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