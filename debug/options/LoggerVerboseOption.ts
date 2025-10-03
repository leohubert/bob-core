import {Command} from "../command.js";
import {CommandOption} from "../../src/index.js";
import { OptionPrimitive } from "@/src/lib/types.js";

export class LoggerVerboseOption implements CommandOption<Command> {
    type: OptionPrimitive = 'boolean'

    option = 'verbose'
    alias = ['v']

    description = 'Enable verbose logging'

    public async handler(this: Command): Promise<void> {
        this.io.info('Setting logger verbose to true')
        this.ctx.logger.verbose = true
        this.io.info(await this.ctx.bambooClient.getProjects())
    }
}