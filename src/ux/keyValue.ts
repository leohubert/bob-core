import chalk from 'chalk';

import type { KeyValueOptions } from '@/src/ux/types.js';

export function keyValue(pairs: Record<string, unknown> | Array<[string, unknown]>, opts?: KeyValueOptions): void {
	const separator = opts?.separator ?? ': ';
	const keyStyle = opts?.keyStyle ?? chalk.bold;

	const entries: Array<[string, unknown]> = Array.isArray(pairs) ? pairs : Object.entries(pairs);

	if (entries.length === 0) return;

	const maxKeyWidth = Math.max(...entries.map(([key]) => key.length));

	for (const [key, value] of entries) {
		console.log(keyStyle(key.padEnd(maxKeyWidth)) + separator + String(value ?? ''));
	}
}
