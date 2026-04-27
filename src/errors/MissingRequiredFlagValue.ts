import type { LoggerContract } from '@/src/contracts/index.js';
import { BobError } from '@/src/errors/BobError.js';
import { quote, renderError } from '@/src/errors/renderError.js';

/** Thrown when a required flag was not provided and no value could be obtained (prompt cancelled or disabled). */
export class MissingRequiredFlagValue extends BobError {
	readonly $type = 'MissingRequiredFlagValue' as const;

	constructor(public readonly flag: string) {
		super(`Flag "${flag}" is required.`);
	}

	pretty(logger: LoggerContract): void {
		renderError(logger, {
			title: `flag ${quote(this.flag)} is required`,
		});
	}
}
