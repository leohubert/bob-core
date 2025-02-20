import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";
import {ArgSignature} from "@/src/CommandParser.js";

export class MissingRequiredArgumentValue extends BobError {
    constructor(public readonly paramSignature: ArgSignature) {
        super(`Argument "${paramSignature.name}" is required.`)
    }

    pretty(): void {
        const log = console.log

        if (this.paramSignature.help) {
            log(chalk`{yellow Help}: ${this.paramSignature.help}\n`)
        }

        log(chalk`  {white.bgRed  ERROR } Argument {bold.yellow ${this.paramSignature.name}} is required.`)
    }
}
