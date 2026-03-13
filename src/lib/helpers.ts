import { Command } from '@/src/Command.js';
import { BobError } from '@/src/errors/index.js';

export function isBobError(err: Error): err is BobError {
	return typeof err === 'object' && err !== null && '$type' in err && err.$type === 'BobError';
}

export function isBobCommandClass(cls: unknown): cls is typeof Command {
	if (typeof cls !== 'function') {
		return false;
	}

	return (cls as any).prototype instanceof Command || (cls as any).$type === 'BobCommand';
}
