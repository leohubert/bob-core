import chalk from 'chalk';

import type { LoggerContract } from '@/src/contracts/index.js';
import { BobError } from '@/src/errors/BobError.js';
import { ErrorDetail, quote, renderError } from '@/src/errors/renderError.js';
import { formatAlias, normalizeAliases } from '@/src/flags/helpers.js';
import { FlagsSchema } from '@/src/lib/types.js';
import { isOptionFlag } from '@/src/shared/flagsUtils.js';

/** Thrown when an unknown flag is supplied and `allowUnknownFlags` is off. */
export class InvalidFlag extends BobError {
	readonly $type = 'InvalidFlag' as const;

	constructor(
		private flag: string,
		private flagsSchema: FlagsSchema = {},
	) {
		super(`Flag ${flag} is not recognized`);
	}

	pretty(logger: LoggerContract): void {
		const options = Object.entries(this.flagsSchema);
		const details: ErrorDetail[] = options.map(([name, definition]) => {
			const aliases = normalizeAliases(definition.alias);
			const aliasSegment = aliases.length > 0 ? aliases.map(a => `, ${formatAlias(a)}`).join('') : '';
			const nameWithAlias = `--${name}${aliasSegment}`;
			const typeDisplay = isOptionFlag(definition) ? definition.options.join(' | ') : definition.type;
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
