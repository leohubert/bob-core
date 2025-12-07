import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';

export class CommandNotFoundError extends BobError {
	constructor(public readonly command: string) {
		super(`Command "${command}" not found.`);
	}

	pretty(logger: Logger): void {
		logger.log(`${chalk.bgRed(' ERROR ')} Command ${chalk.yellow(this.command)} not found.`);
	}
}
