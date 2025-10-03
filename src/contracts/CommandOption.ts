import {OptionDefinition} from "@/src/lib/types.js";
import {Command} from "@/src/Command.js";

export interface CommandOption<C extends Command> extends OptionDefinition {
    option: string

    handler(this: C): Promise<number|void>;
}