import {BobError} from "./BobError";
import chalk from "chalk";

export type BadParameterProps = {
    param: string
    value?: string
    reason?: string
}

export class BadParameter extends BobError {
    constructor(public readonly param: BadParameterProps) {
        let message = `Argument "${param.param}" value is invalid.`
        if (param.reason) {
            message += ` Reason: ${param.reason}`
        } else {
            message += ` Value: "${param.value}"`
        }
        super(message)
    }

    pretty(): void {
        const log = console.log

        log(chalk`  {white.bgRed  ERROR } Argument "${this.param.param}" value is invalid. `)

        if (this.param.value || this.param.reason) {
            log('')
        }

        if (this.param.value) {
            log(chalk`  {blue Value}: ${this.param.value}`)
        }
        if (this.param.reason) {
            log(chalk`  {yellow Reason}: ${this.param.reason}`)
        }
    }
}
