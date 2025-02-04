import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";

export class CommandNotFoundError extends BobError {
    constructor(public readonly command: string, public readonly similarCommands: string[]) {
        super(`Command "${command}" not found.`);
    }

    pretty(): void {
        const log = console.log

        if (this.similarCommands.length) {
            log(chalk`  {white.bgRed  ERROR } Command "${this.command}" not found, Did you mean one of these?`)

            for (const cmd of this.similarCommands) {
                log(chalk`  {gray ⇂ ${cmd}}`)
            }
        } else {
            log(chalk`  {white.bgRed  ERROR } Command "${this.command}" not found.`)
        }
    }
}
