import {Command} from "../../command.js";

export default  class SubCommand extends Command {
    signature = 'test:sub';
    description = 'sub command description'

    protected handle(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}