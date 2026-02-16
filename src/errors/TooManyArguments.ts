import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';

export class TooManyArguments extends BobError {
	constructor(
		public readonly expected: number,
		public readonly received: number,
	) {
		super(`Too many arguments provided. Expected ${expected}, got ${received}.`);
	}

	pretty(logger: Logger): void {
		logger.log(
			`${chalk.white.bgRed(' ERROR ')} Too many arguments provided. Expected ${chalk.bold.yellow(String(this.expected))}, got ${chalk.bold.yellow(String(this.received))}.`,
		);
	}
}
