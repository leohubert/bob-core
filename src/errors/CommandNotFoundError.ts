import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";

export class CommandNotFoundError extends BobError {
    constructor(public readonly command: string) {
        super(`Command "${command}" not found.`);
    }

    pretty(): void {
        const log = console.log

	    log(chalk`{bgRed  ERROR } Command {yellow ${this.command}} not found.`)
	}
}
