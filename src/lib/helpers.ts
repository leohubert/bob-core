import { Command } from '@/src/Command.js';
import { BobError } from '@/src/errors/index.js';

export function isBobError(err: Error): err is BobError {
	return typeof err === 'object' && err !== null && '$type' in err && err.$type === 'BobError';
}

export function isBobCommand(obj: unknown): obj is Command {
	return typeof obj === 'object' && obj !== null && (obj instanceof Command || ('$type' in obj && obj.$type === 'BobCommand'));
}
