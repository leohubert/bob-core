import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";

export class MissingRequiredOptionValue extends BobError {
    constructor(
		public readonly option: string
	) {
        super(`Argument "${option}" is required.`)
    }

    pretty(io: any): void {
        io.log(`${chalk.white.bgRed(' ERROR ')} Option ${chalk.bold.yellow(this.option)} is required.`)
    }
}
