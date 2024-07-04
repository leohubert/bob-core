import {BobError} from "./BobError";
import chalk from "chalk";
import {ArgSignature} from "../CommandParser";

export class MissingSignatureArgument extends BobError {
    constructor(private argument: string, private argumentSignatures: ArgSignature[]) {
        super(`Missing ${argument} in the command signature`);
    }

    pretty(): void {
        const log = console.log

        if (this.argumentSignatures.length) {
            log(chalk`\n{yellow Available arguments}:`)
            for (const argument of this.argumentSignatures) {
                const type = argument.type ? chalk`{white (${argument.type})}` : ''
                const spaces = ' '.repeat(20 - argument.name.length)

                log(chalk`  {green ${argument.name}} ${spaces} ${argument.help ?? '\b'} ${type}`)
            }
            log('')
        }

        log(chalk`  {white.bgRed  ERROR } Argument {bold.yellow ${this.argument}} is missing in the signature.`)
    }
}
