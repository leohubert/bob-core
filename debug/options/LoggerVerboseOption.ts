import {Command} from "../command";
import {CommandOption} from "../../src/contracts/CommandOption";

export class LoggerVerboseOption implements CommandOption<Command> {
    option = 'verbose'
    alias = ['v']

    defaultValue = true

    description = 'Increase the verbosity of the logger'

    public async handler(this: Command): Promise<void> {
        console.log('Setting logger verbose to true')
        this.ctx.logger.verbose = true
        console.log(await this.ctx.bambooClient.getProjects())
    }
}