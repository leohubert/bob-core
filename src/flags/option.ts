import { custom } from '@/src/flags/custom.js';
import type { ParameterOpts } from '@/src/lib/types.js';
import { buildOptionAsk } from '@/src/shared/ask-helpers.js';
import { parseOption } from '@/src/shared/parsers.js';

const _option = custom({
	parse: (v: any, o: ParameterOpts): string => parseOption(v, o.definition.options),
	ask: buildOptionAsk,
	type: 'option',
});

export function optionFlag<const T extends readonly string[], const U extends Record<string, any> = {}>(opts: { options: T } & U) {
	return _option(opts);
}
