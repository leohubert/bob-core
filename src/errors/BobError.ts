import { Logger } from '@/src/Logger.js';

export abstract class BobError extends Error {
	$type = 'BobError' as const;

	abstract pretty(logger: Logger): void;
}
