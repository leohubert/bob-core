import chalk from "chalk";

import {BobError} from "@/src/errors/BobError.js";
import {OptionsSchema} from "@/src/lib/types.js";
import {getOptionDetails} from "@/src/lib/optionHelpers.js";


export class InvalidOption extends BobError {
    constructor(
		private option: string,
		private optionsSchema: OptionsSchema = {}
	) {
        super(`Invalid option ${option} in not recognized`);
    }

    pretty(io: any): void {
		const options = Object.entries(this.optionsSchema);

        if (options.length > 0) {
            io.log(`\n${chalk.yellow('Available options')}:`)

			for (const [name, definition] of options) {
				const details = getOptionDetails(definition);
				const alias = typeof details.alias === 'string' ? [details.alias] : details.alias;
				const typeDisplay = Array.isArray(details.type) ? `[${details.type[0]}]` : details.type;
                const nameWithAlias = `--${name}${alias.length > 0 ? alias.map(a => `, -${a}`).join('') : ''}`;
                const spaces = ' '.repeat(30 - nameWithAlias.length);

                io.log(`  ${chalk.green(nameWithAlias)} ${spaces} ${details.description || '\b'} ${chalk.white(`(${typeDisplay})`)}`);
            }
            io.log('');
        }

        io.log(`${chalk.white.bgRed(' ERROR ')} Option ${chalk.bold.yellow(this.option)} is not recognized.`);
    }
}
