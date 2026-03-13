import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';

export class MissingRequiredFlagValue extends BobError {
	constructor(public readonly flag: string) {
		super(`Flag "${flag}" is required.`);
	}

	pretty(logger: Logger): void {
		logger.log('');
		logger.log(`  ${chalk.bold.white.bgRed(' ERROR ')} Flag ${chalk.bold.yellow(this.flag)} is required.`);
		logger.log('');
	}
}
