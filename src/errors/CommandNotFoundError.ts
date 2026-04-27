import type { LoggerContract } from '@/src/contracts/index.js';
import { BobError } from '@/src/errors/BobError.js';
import { quote, renderError } from '@/src/errors/renderError.js';

/** Thrown by {@link CommandRegistry} when a requested command does not exist and no suggestion was accepted. */
export class CommandNotFoundError extends BobError {
	readonly $type = 'CommandNotFoundError' as const;

	constructor(public readonly command: string) {
		super(`Command "${command}" not found.`);
	}

	pretty(logger: LoggerContract): void {
		renderError(logger, {
			title: `command ${quote(this.command)} not found`,
		});
	}
}
