import type { LoggerContract } from '@/src/contracts/index.js';
import { isBobError } from '@/src/lib/helpers.js';

/**
 * Default error dispatcher used by {@link Cli.runCommand}.
 *
 * Renders {@link BobError}s through their `pretty` method and returns `-1` so
 * the caller can use the value as a process exit code. Any other error type
 * propagates unchanged — these typically represent programmer bugs and should
 * not be silently formatted as user-facing errors.
 */
export class ExceptionHandler {
	private readonly logger: LoggerContract;

	constructor(logger: LoggerContract) {
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
