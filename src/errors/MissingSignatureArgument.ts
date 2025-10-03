import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";
import {OptionDefinition, OptionsSchema} from "@/src/lib/types.js";
import {getOptionDetails} from "@/src/lib/optionHelpers.js";

export class MissingSignatureArgument extends BobError {
    constructor(private argument: string, private argumentsSchema: OptionsSchema) {
        super(`Missing ${argument} in the command signature`);
    }

    pretty(io: any): void {
		const entries = Object.entries(this.argumentsSchema);

        if (entries.length) {
            io.log(chalk`\n{yellow Available arguments}:`)
            for (const [name, definition] of entries) {
				const details = getOptionDetails(definition);
				const typeDisplay = Array.isArray(details.type) ? `[${details.type[0]}]` : details.type;
                const type = typeDisplay ? chalk`{white (${typeDisplay})}` : ''
                const spaces = ' '.repeat(20 - name.length)

                io.log(chalk`  {green ${name}} ${spaces} ${details.description ?? '\b'} ${type}`)
            }
            io.log('')
        }

        io.log(chalk`{white.bgRed  ERROR } Argument {bold.yellow ${this.argument}} is missing in the signature.`)
    }
}
