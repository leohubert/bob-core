import { Logger } from '@/src/Logger.js';
import { isBobError } from '@/src/lib/helpers.js';

export class ExceptionHandler {
	private readonly logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	handle(err: Error) {
		if (isBobError(err)) {
			err.pretty(this.logger);

			return -1;
		}
		throw err;
	}
}
