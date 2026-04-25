import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { quote, renderError } from '@/src/errors/renderError.js';

export class MissingRequiredFlagValue extends BobError {
	constructor(public readonly flag: string) {
		super(`Flag "${flag}" is required.`);
	}

	pretty(logger: Logger): void {
		renderError(logger, {
			title: `flag ${quote(this.flag)} is required`,
		});
	}
}
