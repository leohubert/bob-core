import {Command} from "../../../command.js";

export default class SubSubCommand extends Command {
    signature = 'sub:sub';
    description = 'sub:sub command description'

    protected handle(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}