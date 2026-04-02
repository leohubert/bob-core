import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { FlagDefinition } from '@/src/lib/types.js';

export type ArgumentProps = {
	arg: string;
	value?: any;
	reason?: string;
};

export class BadCommandArgument extends BobError {
	constructor(
		public readonly detail: ArgumentProps,
		public readonly argDefinition?: FlagDefinition,
	) {
		let message = `Argument "${detail.arg}" value is invalid.`;
		if (detail.reason) {
			message += ` Reason: ${detail.reason}`;
		} else {
			message += ` Value: "${detail.value}"`;
		}
		super(message);
	}

	pretty(logger: Logger): void {
		const details: [string, string][] = [];
		if (this.detail.reason != undefined) details.push(['Reason', this.detail.reason]);
		if (this.detail.value != undefined) details.push(['Value', chalk.yellow(this.detail.value)]);
		if (this.argDefinition?.help != undefined) details.push(['Help', chalk.green(this.argDefinition.help)]);

		logger.log('');
		logger.log(`  ${chalk.bold.white.bgRed(' ERROR ')} Argument ${chalk.bold.yellow(this.detail.arg)} value is invalid.`);

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
