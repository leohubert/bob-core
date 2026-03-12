import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { FlagsSchema } from '@/src/lib/types.js';

export class InvalidOption extends BobError {
	constructor(
		private option: string,
		private optionsSchema: FlagsSchema = {},
	) {
		super(`Invalid option ${option} in not recognized`);
	}

	pretty(logger: Logger): void {
		const options = Object.entries(this.optionsSchema);

		if (options.length > 0) {
			logger.log(`\n${chalk.yellow('Available options')}:`);

			for (const [name, definition] of options) {
				const alias = definition.alias ? (typeof definition.alias === 'string' ? [definition.alias] : definition.alias) : [];
				const typeDisplay = Array.isArray(definition.type)
					? `[${definition.type[0]}]`
					: definition.type === 'enum' && definition.options
						? `enum: ${definition.options.join('|')}`
						: definition.type;
				const nameWithAlias = `--${name}${alias.length > 0 ? alias.map(a => `, -${a}`).join('') : ''}`;
				const spaces = ' '.repeat(30 - nameWithAlias.length);

				logger.log(`  ${chalk.green(nameWithAlias)} ${spaces} ${definition.description || '\b'} ${chalk.white(`(${typeDisplay})`)}`);
			}
			logger.log('');
		}

		logger.log(`${chalk.white.bgRed(' ERROR ')} Option ${chalk.bold.yellow(this.option)} is not recognized.`);
	}
}
