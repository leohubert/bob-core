import {Command} from "../command.js";
import {CommandOption} from "../../src/index.js";
import { OptionPrimitive } from "@/src/lib/types.js";

export class LoggerVerboseOption implements CommandOption<Command> {
    type: OptionPrimitive = 'boolean'

    option = 'verbose'
    alias = ['v']

    description = 'Enable verbose logging'

    public async handler(this: Command): Promise<void> {
        console.log('Setting logger verbose to true')
        this.ctx.logger.verbose = true
        console.log(await this.ctx.bambooClient.getProjects())
    }
}