import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { FlagsSchema } from '@/src/lib/types.js';

export class InvalidOption extends BobError {
	constructor(
		private option: string,
		private optionsSchema: FlagsSchema = {},
	) {
		super(`Option ${option} is not recognized`);
	}

	pretty(logger: Logger): void {
		logger.log('');
		logger.log(`  ${chalk.bold.white.bgRed(' ERROR ')} Option ${chalk.bold.yellow(this.option)} is not recognized.`);

		const options = Object.entries(this.optionsSchema);

		if (options.length > 0) {
			logger.log('');
			logger.log(`  ${chalk.dim('Available options:')}`);
			logger.log('');

			const rows = options.map(([name, definition]) => {
				const alias = definition.alias ? (typeof definition.alias === 'string' ? [definition.alias] : definition.alias) : [];
				const typeDisplay = Array.isArray(definition.type)
					? `[${definition.type[0]}]`
					: definition.type === 'enum' && definition.options
						? definition.options.join(' | ')
						: definition.type;
				const nameWithAlias = `--${name}${alias.length > 0 ? alias.map(a => `, -${a}`).join('') : ''}`;
				return { nameWithAlias, description: definition.description || '', typeDisplay };
			});

			const maxName = Math.max(...rows.map(r => r.nameWithAlias.length));

			for (const row of rows) {
				const padding = ' '.repeat(maxName - row.nameWithAlias.length + 2);
				logger.log(`    ${chalk.green(row.nameWithAlias)}${padding}${row.description}  ${chalk.dim(`(${row.typeDisplay})`)}`);
			}
		}
		logger.log('');
	}
}
