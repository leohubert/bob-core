import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { ErrorDetail, quote, renderError } from '@/src/errors/renderError.js';
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
		const details: ErrorDetail[] = [];
		if (this.detail.value != undefined) details.push([chalk.dim('value'), chalk.yellow(`"${this.detail.value}"`)]);
		if (this.detail.reason != undefined) details.push([chalk.dim('reason'), this.detail.reason]);
		if (this.argDefinition?.help != undefined) details.push([chalk.dim('help'), chalk.green(this.argDefinition.help)]);

		renderError(logger, {
			title: `argument ${quote(this.detail.arg)} is invalid`,
			details,
		});
	}
}
