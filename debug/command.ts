import {Command as BaseCommand} from "../src";
import {CommandOption} from "../src/contracts/CommandOption";
import {LoggerVerboseOption} from "./options/LoggerVerboseOption";

export type CommandContext = {
    bambooClient: {
        getProjects: () => Promise<any>
    }
    logger: {
        verbose: boolean
    }
}

export abstract class Command extends BaseCommand<CommandContext> {

    protected defaultOptions(): CommandOption<Command>[] {
        return [
            ...super.defaultOptions(),
            new LoggerVerboseOption()
        ];
    }
}