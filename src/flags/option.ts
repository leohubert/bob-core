import { custom } from '@/src/flags/custom.js';
import type { FlagDefinition, InitFlagDefinition } from '@/src/lib/types.js';
import { buildOptionAsk } from '@/src/shared/ask-helpers.js';
import { parseOption } from '@/src/shared/parsers.js';

// /**
//  * Enum-style flag — `options` is a `readonly` tuple of literal strings; the
//  * resulting type is the union of those literals.
//  */
// export function optionFlag<const T extends readonly string[], const U extends Partial<FlagProps>>(
// 	opts: { options: T } & U,
// ): U & Omit<FlagProps<T[number]>, 'default'> & { parse(input: any, opts: ParameterOpts): T[number] } {
// 	return custom<T[number]>({
// 		parse: (v: any, o: ParameterOpts) => parseOption(v, (o.definition.options ?? []) as T) as T[number],
// 		ask: buildOptionAsk,
// 		...opts,
// 		type: 'option',
// 	})() as U & Omit<FlagProps<T[number]>, 'default'> & { parse(input: any, opts: ParameterOpts): T[number] };
// }

export function optionFlag<const T extends readonly string[], const O extends Partial<InitFlagDefinition<T[number], { options: T }>>>(
	opts: { options: T } & O,
) {
	const { options, ...newOpts } = opts;
	return custom<T[number], { options: T }>({
		type: 'option',
		ask: buildOptionAsk,
		parse: v => parseOption(v, (options ?? []) as T) as T[number],
		...opts,
	})(newOpts) as FlagDefinition<T[number], { options: T }> & O;
}
