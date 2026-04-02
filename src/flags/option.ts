import { custom } from '@/src/flags/custom.js';
import type { FlagProps, ParameterOpts } from '@/src/lib/types.js';
import { buildOptionAsk } from '@/src/shared/ask-helpers.js';
import { parseOption } from '@/src/shared/parsers.js';

export function optionFlag<const T extends readonly string[], const U extends Partial<FlagProps>>(
	opts: { options: T } & U,
): U & FlagProps<T[number]> & { parse(input: any, opts: ParameterOpts): T[number] } {
	return custom<T[number]>({
		parse: (v: any, o: ParameterOpts) => parseOption(v, o.definition.options) as T[number],
		ask: buildOptionAsk,
		...opts,
		type: 'option',
	})();
}
