import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { FlagDefinition } from '@/src/lib/types.js';

export type BadFlagParams = {
	flag: string;
	value?: any;
	reason?: string;
};

export class BadCommandFlag extends BobError {
	constructor(
		public readonly param: BadFlagParams,
		public readonly flagDefinition?: FlagDefinition,
	) {
		let message = `Flag "${param.flag}" value is invalid.`;
		if (param.reason) {
			message += ` Reason: ${param.reason}`;
		} else {
			message += ` Value: "${param.value}"`;
		}
		super(message);
	}

	pretty(logger: Logger): void {
		const details: [string, string][] = [];
		if (this.param.reason != undefined) details.push(['Reason', this.param.reason]);
		if (this.param.value != undefined) details.push(['Value', chalk.yellow(this.param.value)]);
		if (this.flagDefinition?.help != undefined) details.push(['Help', chalk.green(this.flagDefinition.help)]);

		logger.log('');
		logger.log(`  ${chalk.bold.white.bgRed(' ERROR ')} Flag ${chalk.bold.yellow(this.param.flag)} value is invalid.`);

		if (details.length > 0) {
			logger.log('');
			const maxLabel = Math.max(...details.map(([l]) => l.length));
			for (const [label, value] of details) {
				logger.log(`  ${' '.repeat(maxLabel - label.length)}${chalk.dim(label)}  ${value}`);
			}
		}
		logger.log('');
	}
}
