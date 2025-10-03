import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";
import {OptionDefinition} from "@/src/lib/types.js";

export class MissingRequiredArgumentValue extends BobError {
    constructor(
		public readonly paramName: string
	) {
        super(`Argument "${paramName}" is required.`)
    }

    pretty(): void {
        const log = console.log

        log(chalk`{white.bgRed  ERROR } Argument {bold.yellow ${this.paramName}} is required.`)
    }
}
