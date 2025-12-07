import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';

export class MissingRequiredOptionValue extends BobError {
	constructor(public readonly option: string) {
		super(`Argument "${option}" is required.`);
	}

	pretty(logger: Logger): void {
		logger.log(`${chalk.white.bgRed(' ERROR ')} Option ${chalk.bold.yellow(this.option)} is required.`);
	}
}
