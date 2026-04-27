import chalk from 'chalk';

import type { LoggerContract } from '@/src/contracts/index.js';
import { BobError } from '@/src/errors/BobError.js';
import { renderError } from '@/src/errors/renderError.js';

/** Thrown in strict mode when more positional arguments were supplied than the schema declares. */
export class TooManyArguments extends BobError {
	readonly $type = 'TooManyArguments' as const;

	constructor(
		public readonly expected: number,
		public readonly received: number,
	) {
		super(`Too many arguments provided. Expected ${expected}, got ${received}.`);
	}

	pretty(logger: LoggerContract): void {
		renderError(logger, {
			title: 'too many arguments',
			details: [
				[chalk.dim('expected'), chalk.green(String(this.expected))],
				[chalk.dim('received'), chalk.bold.yellow(String(this.received))],
			],
		});
	}
}
