import type { ArgInput, ArgOpts, CustomArgDef } from '@/src/lib/types.js';

export function customArg<T>(defaults?: ArgInput<CustomArgDef<T>>): <const U extends ArgInput<CustomArgDef<T>>>(overrides?: U) => CustomArgDef<T> & U {
	return <const U extends ArgInput<CustomArgDef<T>>>(overrides?: U) =>
		({
			default: defaults?.multiple || overrides?.multiple ? [] : null,
			parse: (input: any, _opts: ArgOpts) => input,
			...defaults,
			...overrides,
			type: 'custom',
		}) as CustomArgDef<T> & U;
}
