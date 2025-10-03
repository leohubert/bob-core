import {CommandOption, CommandWithSignature as BaseCommand} from "@/src/index.js";
import {LoggerVerboseOption} from "./options/LoggerVerboseOption.js";

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