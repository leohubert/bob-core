import type { LoggerContract } from '@/src/contracts/index.js';
import { BobError } from '@/src/errors/BobError.js';
import { quote, renderError } from '@/src/errors/renderError.js';

/** Thrown when a required positional argument was not provided and no value could be obtained. */
export class MissingRequiredArgumentValue extends BobError {
	readonly $type = 'MissingRequiredArgumentValue' as const;

	constructor(public readonly argument: string) {
		super(`Argument "${argument}" is required.`);
	}

	pretty(logger: LoggerContract): void {
		renderError(logger, {
			title: `argument ${quote(this.argument)} is required`,
		});
	}
}
