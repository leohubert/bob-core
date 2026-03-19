import type { CustomFlagDef, FlagInput, FlagOpts, HasDefault } from '@/src/lib/types.js';

type CustomFlagReturn<T, U> = U extends { default: NonNullable<CustomFlagDef<T>['default']> }
	? CustomFlagDef<T> & U & HasDefault
	: U extends { multiple: true }
		? CustomFlagDef<T> & U & HasDefault
		: CustomFlagDef<T> & U;

export function customFlag<T>(defaults?: FlagInput<CustomFlagDef<T>>): <const U extends FlagInput<CustomFlagDef<T>>>(overrides?: U) => CustomFlagReturn<T, U> {
	return <const U extends FlagInput<CustomFlagDef<T>>>(overrides?: U) =>
		({
			default: defaults?.multiple || overrides?.multiple ? [] : null,
			parse: (input: any, _opts: FlagOpts) => input,
			...defaults,
			...overrides,
			type: 'custom',
		}) as CustomFlagReturn<T, U>;
}
