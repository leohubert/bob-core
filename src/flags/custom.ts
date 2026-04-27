import { CustomOptions, FlagDefinition, InitFlagDefinition } from '@/src/lib/types.js';

/**
 * Escape hatch for declaring arbitrary parameter types. Returns a builder
 * function — call it with overrides to produce a `FlagDefinition`.
 *
 * `parse` is required when there's no built-in for the target type. `multiple`
 * defaults the value to `[]`; non-multiple flags default to `null`.
 *
 * The `type` literal supplied in `defaults` is preserved in the returned shape
 * so downstream consumers can rely on it (e.g. for help rendering).
 */
export function custom<T = string, C extends CustomOptions = CustomOptions, const D extends InitFlagDefinition<T, C> = InitFlagDefinition<T, C>>(
	defaults: D = {} as D,
) {
	return function <const O extends InitFlagDefinition<T, C> = InitFlagDefinition<T, C>>(overrides?: O): FlagDefinition<T, C> & D & O {
		return {
			type: 'custom',
			default: defaults.multiple || overrides?.multiple ? [] : null,
			parse: input => input,
			...defaults,
			...overrides,
		} as FlagDefinition<T, C> & D & O;
	};
}
