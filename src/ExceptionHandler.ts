import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/index.js';

export class ExceptionHandler {
	private readonly logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	handle(err: Error | BobError) {
		if (err instanceof BobError) {
			err.pretty(this.logger);

			return -1;
		}
		throw err;
	}
}
