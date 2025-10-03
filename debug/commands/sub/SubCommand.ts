import {Command} from "../../command.js";

export default  class SubCommand extends Command {
    signature = 'sub';
    description = 'sub command description'

    protected handle(ctx: any, opts: any): Promise<void> {
		console.log("Sub command executed", ctx, opts);
        throw new Error("Method not implemented.");
    }
}