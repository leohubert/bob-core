import type { CustomOptions, FlagProps, ParameterOpts } from '@/src/lib/types.js';

// Overload 1: explicit T — custom<Date>({parse: ...})
export function custom<T, const D extends FlagProps<any> = FlagProps<T>>(
	defaults?: D,
): <const U extends FlagProps<T> = {}>(
	overrides?: U & Record<Exclude<keyof U, keyof FlagProps<T> | keyof D>, never>,
) => D & U & { parse(input: any, opts: ParameterOpts): T };

// Overload 2: explicit T + P — custom<number, {min?: number}>({parse: ...})
export function custom<T, P extends CustomOptions = CustomOptions>(
	defaults?: FlagProps<T> & Partial<P>,
): <const U extends FlagProps<T> & Partial<P> = FlagProps<T> & Partial<P>>(
	overrides?: U & Record<Exclude<keyof U, keyof FlagProps<T> | keyof P>, never>,
) => FlagProps<T> & P & U & { parse(input: any, opts: ParameterOpts): T };

// Implementation
export function custom(defaults?: any): any {
	return (overrides?: any) =>
		({
			type: 'custom',
			default: defaults?.multiple || overrides?.multiple ? [] : null,
			parse: (input: string) => input,
			...defaults,
			...overrides,
		}) as any;
}
