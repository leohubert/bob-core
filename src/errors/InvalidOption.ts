import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { getOptionDetails } from '@/src/lib/optionHelpers.js';
import { OptionsSchema } from '@/src/lib/types.js';

export class InvalidOption extends BobError {
	constructor(
		private option: string,
		private optionsSchema: OptionsSchema = {},
	) {
		super(`Invalid option ${option} in not recognized`);
	}

	pretty(logger: Logger): void {
		const options = Object.entries(this.optionsSchema);

		if (options.length > 0) {
			logger.log(`\n${chalk.yellow('Available options')}:`);

			for (const [name, definition] of options) {
				const details = getOptionDetails(definition);
				const alias = details.alias ? (typeof details.alias === 'string' ? [details.alias] : details.alias) : [];
				const typeDisplay = Array.isArray(details.type) ? `[${details.type[0]}]` : details.type;
				const nameWithAlias = `--${name}${alias.length > 0 ? alias.map(a => `, -${a}`).join('') : ''}`;
				const spaces = ' '.repeat(30 - nameWithAlias.length);

				logger.log(`  ${chalk.green(nameWithAlias)} ${spaces} ${details.description || '\b'} ${chalk.white(`(${typeDisplay})`)}`);
			}
			logger.log('');
		}

		logger.log(`${chalk.white.bgRed(' ERROR ')} Option ${chalk.bold.yellow(this.option)} is not recognized.`);
	}
}
