import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";
import {ArgSignature} from "@/src/CommandParser.js";

export class InvalidOption extends BobError {
    constructor(private option: string, private optionsSignature: ArgSignature[]) {
        super(`Invalid option ${option} in not recognized`);
    }

    pretty(): void {
        const log = console.log

        if (this.optionsSignature.length > 0) {
            log(chalk`\n{yellow Available options}:`)
            for (const option of this.optionsSignature) {
                const type = option.type ? chalk`{white (${option.type})}` : ''
                const nameWithAlias = `--${option.name}${option.alias?.map(a => `, -${a}`).join('') ?? ''}`

                const spaces = ' '.repeat(30 - nameWithAlias.length)

                log(chalk`  {green ${nameWithAlias}} ${spaces} ${option.help ?? '\b'} ${type}`)
            }
            log('')
        }

        log(chalk`{white.bgRed  ERROR } Option {bold.yellow ${this.option}} is not recognized.`)
    }
}
