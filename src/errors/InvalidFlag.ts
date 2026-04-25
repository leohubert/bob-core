import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { ErrorDetail, quote, renderError } from '@/src/errors/renderError.js';
import { normalizeAliases } from '@/src/flags/helpers.js';
import { FlagsSchema } from '@/src/lib/types.js';

export class InvalidFlag extends BobError {
	constructor(
		private flag: string,
		private flagsSchema: FlagsSchema = {},
	) {
		super(`Flag ${flag} is not recognized`);
	}

	pretty(logger: Logger): void {
		const options = Object.entries(this.flagsSchema);
		const details: ErrorDetail[] = options.map(([name, definition]) => {
			const aliases = normalizeAliases(definition.alias);
			const nameWithAlias = `--${name}${aliases.length > 0 ? aliases.map(a => `, -${a}`).join('') : ''}`;
			const typeDisplay =
				definition.type === 'option' && 'options' in definition && (definition as any).options ? (definition as any).options.join(' | ') : definition.type;
			const description = definition.description ?? '';
			const value = description ? `${description} ${chalk.dim(`(${typeDisplay})`)}` : chalk.dim(`(${typeDisplay})`);
			return [chalk.cyan(nameWithAlias), value];
		});

		renderError(logger, {
			title: `flag ${quote(this.flag)} is not recognized`,
			details,
		});
	}
}
