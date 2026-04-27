import { Command } from '@/src/Command.js';
import { BobError } from '@/src/errors/index.js';

export function isBobError(err: unknown): err is BobError {
	return err instanceof BobError;
}

export function isBobCommandClass(cls: unknown): cls is typeof Command {
	if (typeof cls !== 'function') {
		return false;
	}

	return (cls as any).prototype instanceof Command || (cls as any).$type === 'BobCommand';
}
