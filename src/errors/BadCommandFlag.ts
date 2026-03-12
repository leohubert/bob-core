import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';

export type FlagProps = {
	flag: string;
	value?: string;
	reason?: string;
};

export class BadCommandFlag extends BobError {
	constructor(public readonly param: FlagProps) {
		let message = `Flag "${param.flag}" value is invalid.`;
		if (param.reason) {
			message += ` Reason: ${param.reason}`;
		} else {
			message += ` Value: "${param.value}"`;
		}
		super(message);
	}

	pretty(logger: Logger): void {
		logger.log(`  ${chalk.white.bgRed(' ERROR ')} Flag ${chalk.bold.yellow(this.param.flag)} value is invalid. `);

		if (this.param.value || this.param.reason) {
			logger.log('');
		}

		if (this.param.value) {
			logger.log(`  ${chalk.blue('Value')}: ${this.param.value}`);
		}
		if (this.param.reason) {
			logger.log(`  ${chalk.yellow('Reason')}: ${this.param.reason}`);
		}
	}
}
