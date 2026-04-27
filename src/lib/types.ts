import { Command } from '@/src/Command.js';
import type { UX } from '@/src/ux/index.js';

export type ContextDefinition = any;

export type CustomOptions = Record<string, unknown>;

export type FlagKind = 'string' | 'number' | 'boolean' | 'option' | 'file' | 'directory' | 'url' | 'custom';

/**
 * Options handed to a flag's `parse`, `ask`, and `handler` callbacks.
 *
 * `definition` is typed as the canonical {@link FlagDefinition}. Builder-specific
 * extras (`options`, `min`, `max`, `exists`, `secret`) live directly on
 * {@link FlagDefinition}, so handlers can read them without `any` casts while still
 * being honest that they are optional at the type level.
 */
export type FlagOpts<C extends ContextDefinition = ContextDefinition, P extends CustomOptions = CustomOptions> = {
	name: string;
	ux: UX;
	ctx: C;
	definition: FlagDefinition<C, P>;
	cmd: typeof Command;
};

export type FlagDefinition<T = any, C extends CustomOptions = CustomOptions> = {
	[key in keyof C]: C[keyof C];
} & {
	parse: (input: any, opts: FlagOpts<any, C>) => T;
	type?: FlagKind;
	ask?: (opts: FlagOpts<any, C>) => Promise<any>;
	description?: string;
	required?: boolean;
	default?: T | T[] | null | (() => T | T[] | null) | (() => Promise<T | T[] | null>);
	multiple?: boolean;
	help?: string;
	alias?: string | readonly string[];
	handler?: (value: T, opts: FlagOpts<any, C>) => { shouldStop: boolean } | void;
};

export type InitFlagDefinition<T = any, C extends CustomOptions = CustomOptions> = Partial<FlagDefinition<T, C>>;

/** Infers the runtime return type of a flag definition, accounting for `multiple`. */
export type InferFlagReturn<O> = O extends { parse: (...args: any[]) => infer R }
	? O extends { multiple: true }
		? [R] extends [Array<unknown>]
			? R
			: R[]
		: R
	: never;

/**
 * `true` when the parsed value cannot be `null`:
 *  - `required: true`
 *  - `multiple: true` (always an array)
 *  - `default` resolves to a value where neither `null` nor `undefined` is in the union
 *    (covers `T`, `T[]`, `() => T`, `() => Promise<T>`)
 */
type IsGuaranteed<O> = O extends { required: true }
	? true
	: O extends { multiple: true }
		? true
		: O extends { default: infer D }
			? null extends D
				? false
				: undefined extends D
					? false
					: true
			: false;

/**
 * Final value type seen by the handler — `T` if guaranteed (required, multiple,
 * or non-null default), otherwise `T | null`.
 */
export type FlagReturnType<O> = IsGuaranteed<O> extends true ? InferFlagReturn<O> : InferFlagReturn<O> | null;

/** Historic alias — kept so `FlagType<O>` keeps working as a value-inference helper. */
export type FlagType<O> = InferFlagReturn<O>;

/** Schema mapping flag names to their {@link FlagDefinition}. */
export type FlagsSchema = {
	[key: string]: FlagDefinition<any, any>;
};

/** Inferred runtime shape of all flags in a schema. */
export type FlagsObject<Options extends FlagsSchema> = {
	[Key in keyof Options]: FlagReturnType<Options[Key]>;
};

/**
 * Schema for positional arguments.
 *
 * Note on booleans: positional booleans don't really make sense, so the
 * canonical {@link Args} builder set deliberately omits `Args.boolean`. The
 * type itself is a structural alias of {@link FlagsSchema} (rather than a
 * branded subtype) to keep literal-type inference flowing through the builder
 * generics without surprising errors. If you put `Flags.boolean()` in
 * `static args`, the runtime parser will accept it but you're outside the
 * supported design.
 */
export type ArgDefinition = FlagDefinition;
export type ArgsSchema = FlagsSchema;

export type InferFlags<T> = T extends { flags: infer O extends FlagsSchema } ? O : FlagsSchema;
export type InferArgs<T> = T extends { args: infer A extends ArgsSchema } ? A : ArgsSchema;

/** `{ flags, args }` pair for a given Command class — the second handler argument. */
export type Parsed<T> = {
	flags: FlagsObject<InferFlags<T>>;
	args: FlagsObject<InferArgs<T>>;
};
