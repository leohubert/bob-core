import chalk from 'chalk';

import type { LoggerContract } from '@/src/contracts/index.js';
import { BobError } from '@/src/errors/BobError.js';
import { ErrorDetail, quote, renderError } from '@/src/errors/renderError.js';
import { FlagDefinition } from '@/src/lib/types.js';

export type BadFlagParams = {
	flag: string;
	value?: any;
	reason?: string;
};

/** Thrown when a flag's value cannot be converted by its `parse` function (validation failure, type mismatch, …). */
export class BadCommandFlag extends BobError {
	readonly $type = 'BadCommandFlag' as const;

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

	pretty(logger: LoggerContract): void {
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
