import {Command as BaseCommand} from "../src";

export type CommandContext = {
    bambooClient: {
        getProjects: () => Promise<any>
    }
}

export abstract class Command extends BaseCommand<CommandContext> {

}