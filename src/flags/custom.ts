import type { CustomOptions, FlagProps, ParameterOpts } from '@/src/lib/types.js';

export function custom<T, P extends CustomOptions = CustomOptions>(defaults?: FlagProps<T> & Partial<P>) {
	function build(): FlagProps<T> & P & { parse(input: any, opts: ParameterOpts): T };
	function build<const U extends FlagProps<T> & Partial<P>>(
		overrides: U & Record<Exclude<keyof U, keyof FlagProps<T> | keyof P>, never>,
	): Omit<FlagProps<T>, 'default'> & P & U & { parse(input: any, opts: ParameterOpts): T };
	function build(overrides?: any): any {
		return {
			type: 'custom',
			default: defaults?.multiple || overrides?.multiple ? [] : null,
			...defaults,
			...overrides,
		};
	}
	return build;
}
