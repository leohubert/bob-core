import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";

export class MissingRequiredArgumentValue extends BobError {
    constructor(
		public readonly argument: string
	) {
        super(`Argument "${argument}" is required.`)
    }

    pretty(io: any): void {
        io.log(`${chalk.white.bgRed(' ERROR ')} Argument ${chalk.bold.yellow(this.argument)} is required.`)
    }
}
