import {Command} from "../command";
import {CommandOption} from "../../src";

export class LoggerVerboseOption implements CommandOption<Command> {
    option = 'verbose'
    alias = ['v']

    defaultValue = true

    description = 'Enable verbose logging'

    public async handler(this: Command): Promise<void> {
        console.log('Setting logger verbose to true')
        this.ctx.logger.verbose = true
        console.log(await this.ctx.bambooClient.getProjects())
    }
}