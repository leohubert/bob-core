import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { quote, renderError } from '@/src/errors/renderError.js';

export class CommandNotFoundError extends BobError {
	constructor(public readonly command: string) {
		super(`Command "${command}" not found.`);
	}

	pretty(logger: Logger): void {
		renderError(logger, {
			title: `command ${quote(this.command)} not found`,
		});
	}
}
