import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { ErrorDetail, quote, renderError } from '@/src/errors/renderError.js';
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
		const details: ErrorDetail[] = [];
		if (this.param.value != undefined) details.push([chalk.dim('value'), chalk.yellow(`"${this.param.value}"`)]);
		if (this.param.reason != undefined) details.push([chalk.dim('reason'), this.param.reason]);
		if (this.flagDefinition?.help != undefined) details.push([chalk.dim('help'), chalk.green(this.flagDefinition.help)]);

		renderError(logger, {
			title: `flag ${quote(this.param.flag)} is invalid`,
			details,
		});
	}
}
