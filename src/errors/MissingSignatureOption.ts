import {BobError} from "./BobError";
import chalk from "chalk";
import {ArgSignature} from "../CommandParser";

export class MissingSignatureOption extends BobError {
    constructor(private option: string, private optionsSignature: ArgSignature[]) {
        super(`Missing ${option} in the command signature`);
    }

    pretty(): void {
        const log = console.log

        if (this.optionsSignature.length) {
            log(chalk`{yellow Available options}:`)
            for (const option of this.optionsSignature) {
                const type = option.type ? chalk`{white (${option.type})}` : ''
                const spaces = ' '.repeat(20 - option.name.length)

                log(chalk`  {green ${option.name}} ${spaces} ${option.help ?? '\b'} ${type}`)
            }
            log('')
        }

        log(chalk`  {white.bgRed  ERROR } Option {bold.yellow ${this.option}} is missing in the signature.`)
    }
}
