import { custom } from '@/src/flags/custom.js';
import type { FlagProps, ParameterOpts } from '@/src/lib/types.js';
import { buildOptionAsk } from '@/src/shared/ask-helpers.js';
import { parseOption } from '@/src/shared/parsers.js';

export function optionFlag<const T extends readonly string[], const U extends FlagProps>(opts: { options: T } & U) {
	return custom<T[number], { options: T }>({
		parse: (v: any, o: ParameterOpts): string => parseOption(v, o.definition.options),
		ask: buildOptionAsk,
		...opts,
		type: 'option',
	})(opts);
}
