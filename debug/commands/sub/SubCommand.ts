import {Command} from "../../command.js";

export default  class SubCommand extends Command {
    signature = 'sub';
    description = 'sub command description'

    protected handle(): Promise<void> {
		console.log("Sub command executed");
        throw new Error("Method not implemented.");
    }
}