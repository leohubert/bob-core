import {Command} from "../../command";

export default  class SubCommand extends Command {
    signature = 'sub';
    description = 'sub command description'

    protected handle(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}