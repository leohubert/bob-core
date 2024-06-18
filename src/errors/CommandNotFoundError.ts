import {BobError} from "./BobError";
import * as SS from "string-similarity";
import chalk from "chalk";

export class CommandNotFoundError extends BobError {
    constructor(public readonly command: string, public readonly availableCommands: string[]) {
        super(`Command "${command}" not found.`);
    }

    pretty(): void {
        const log = console.log

        const similarCommands = this.availableCommands.filter(
            cmd =>
                cmd //
                    .split(':')
                    .filter(part => SS.compareTwoStrings(part, this.command) > 0.3).length,
        )

        if (similarCommands.length) {
            log(chalk`  {white.bgRed  ERROR } Command "${this.command}" is not defined, Did you mean one of these?`)

            for (const cmd of similarCommands) {
                log(chalk`  {gray ⇂ ${cmd}}`)
            }
        } else {
            log(chalk`  {white.bgRed  ERROR } Command "${this.command}" is not defined.`)
        }
    }
}
