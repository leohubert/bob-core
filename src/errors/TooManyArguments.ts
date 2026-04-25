import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { renderError } from '@/src/errors/renderError.js';

export class TooManyArguments extends BobError {
	constructor(
		public readonly expected: number,
		public readonly received: number,
	) {
		super(`Too many arguments provided. Expected ${expected}, got ${received}.`);
	}

	pretty(logger: Logger): void {
		renderError(logger, {
			title: 'too many arguments',
			details: [
				[chalk.dim('expected'), chalk.green(String(this.expected))],
				[chalk.dim('received'), chalk.bold.yellow(String(this.received))],
			],
		});
	}
}
