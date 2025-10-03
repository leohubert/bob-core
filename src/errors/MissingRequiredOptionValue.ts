import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";
import {OptionDefinition} from "@/src/lib/types.js";

export class MissingRequiredOptionValue extends BobError {
    constructor(
		public readonly option: string
	) {
        super(`Argument "${option}" is required.`)
    }

    pretty(io: any): void {
        io.log(chalk`{white.bgRed  ERROR } Option {bold.yellow ${this.option}} is required.`)
    }
}
