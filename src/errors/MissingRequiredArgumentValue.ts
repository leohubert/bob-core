import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { quote, renderError } from '@/src/errors/renderError.js';

export class MissingRequiredArgumentValue extends BobError {
	constructor(public readonly argument: string) {
		super(`Argument "${argument}" is required.`);
	}

	pretty(logger: Logger): void {
		renderError(logger, {
			title: `argument ${quote(this.argument)} is required`,
		});
	}
}
