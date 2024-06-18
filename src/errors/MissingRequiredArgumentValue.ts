import {BobError} from "./BobError";
import chalk from "chalk";
import {ArgSignature} from "../Parser";

export class MissingRequiredArgumentValue extends BobError {
    constructor(public readonly paramSignature: ArgSignature) {
        super(`Argument "${paramSignature.name}" is required.`)
    }

    pretty(): void {
        const log = console.log

        log(chalk`  {white.bgRed  ERROR } Argument "${this.paramSignature.name}" is required.`)
        if (this.paramSignature.help) {
            log(chalk`\n  {yellow Help}: ${this.paramSignature.help}`)
        }
    }
}
