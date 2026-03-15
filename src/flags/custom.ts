import type { CustomFlagDef, FlagInput } from '@/src/lib/types.js';

export function customFlag<T>(defaults?: FlagInput<CustomFlagDef<T>>): <const U extends FlagInput<CustomFlagDef<T>>>(overrides?: U) => CustomFlagDef<T> & U {
	return <const U extends FlagInput<CustomFlagDef<T>>>(overrides?: U) =>
		({
			default: defaults?.multiple || overrides?.multiple ? [] : null,
			parse: (input: any) => input,
			...defaults,
			...overrides,
			type: 'custom',
		}) as CustomFlagDef<T> & U;
}
