import { CommandIO } from '@/src/CommandIO.js';
import { Logger } from '@/src/Logger.js';

export abstract class BobError extends Error {
	abstract pretty(logger: Logger): void;
}
