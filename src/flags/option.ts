import { custom } from '@/src/flags/custom.js';
import type { InitFlagDefinition } from '@/src/lib/types.js';
import { buildOptionAsk } from '@/src/shared/ask-helpers.js';
import { parseOption } from '@/src/shared/parsers.js';

export function optionFlag<const T extends readonly string[], const O extends Partial<InitFlagDefinition<T[number], { options: T }>>>(
	opts: { options: T } & O,
) {
	return custom<T[number], { options: T }>({
		type: 'option',
		ask: buildOptionAsk,
		parse: v => parseOption(v, (opts.options ?? []) as T) as T[number],
	})(opts);
}
