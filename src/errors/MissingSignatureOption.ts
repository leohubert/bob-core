import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";
import {OptionDefinition, OptionsSchema} from "@/src/lib/types.js";
import {getOptionDetails} from "@/src/lib/optionHelpers.js";

export class MissingSignatureOption extends BobError {
    constructor(private option: string, private optionsSchema: OptionsSchema) {
        super(`Missing ${option} in the command signature`);
    }

    pretty(): void {
        const log = console.log
		const entries = Object.entries(this.optionsSchema);

        if (entries.length) {
            log(chalk`{yellow Available options}:`)
            for (const [name, definition] of entries) {
				const details = getOptionDetails(definition);
				const typeDisplay = Array.isArray(details.type) ? `[${details.type[0]}]` : details.type;
                const type = typeDisplay ? chalk`{white (${typeDisplay})}` : ''
                const spaces = ' '.repeat(20 - name.length)

                log(chalk`  {green ${name}} ${spaces} ${details.description ?? '\b'} ${type}`)
            }
            log('')
        }

        log(chalk`{white.bgRed  ERROR } Option {bold.yellow ${this.option}} is missing in the signature.`)
    }
}
