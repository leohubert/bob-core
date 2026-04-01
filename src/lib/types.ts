import { Command } from '@/src/Command.js';
import type { UX } from '@/src/ux/index.js';

// === IsGuaranteed structural check ===

type HasExplicitDefault<O> = O extends { default: infer D } ? (undefined extends D ? false : null extends D ? false : true) : false;

export type ContextDefinition = any;

// === Unified parameter definition ===

export type CustomOptions = Record<string, unknown>;

export type ParameterOpts<C extends ContextDefinition = ContextDefinition> = {
	name: string;
	ux: UX;
	ctx: C;
	definition: FlagDefinition & Record<string, any>;
	cmd: typeof Command;
};

export type FlagProps<T = any> = {
	type?: string;
	parse?: (input: any, opts: ParameterOpts) => T;
	ask?: (opts: ParameterOpts) => Promise<any>;
	description?: string;
	required?: boolean;
	default?: T | T[] | null | (() => Promise<T | T[] | null>);
	multiple?: boolean;
	help?: string;
	alias?: string | readonly string[];
	handler?: (value: T, opts: ParameterOpts) => { shouldStop: boolean } | void;
};

export type FlagDefinition = FlagProps & { parse(input: any, opts: ParameterOpts): any };

// === Type inference ===

type MaybeArray<T, O> = O extends { multiple: true } ? ([T] extends [Array<unknown>] ? T : T[]) : T;

type InferParseReturn<O> = O extends { parse: (...args: any[]) => infer R } ? R : never;

export type FlagType<O> = O extends {
	type: 'option';
	options: infer T extends readonly string[];
}
	? MaybeArray<T[number], O>
	: MaybeArray<InferParseReturn<O>, O>;

export type IsGuaranteed<O> = O extends { required: true } ? true : O extends { multiple: true } ? true : HasExplicitDefault<O> extends true ? true : false;

export type FlagReturnType<O> = IsGuaranteed<O> extends true ? FlagType<O> : FlagType<O> | null;

// === Schema types ===

export type FlagsSchema = {
	[key: string]: FlagDefinition;
};

export type FlagsObject<Options extends FlagsSchema> = {
	[Key in keyof Options]: FlagReturnType<Options[Key]>;
};

export type ArgsSchema = FlagsSchema;
export type ArgumentsSchema = ArgsSchema;

export type ArgsObject<Arguments extends ArgsSchema> = {
	[Key in keyof Arguments]: FlagReturnType<Arguments[Key]>;
};

// === Parsed type ===

export type InferFlags<T> = T extends { flags: infer O extends FlagsSchema } ? O : FlagsSchema;
export type InferArgs<T> = T extends { args: infer A extends ArgsSchema } ? A : ArgsSchema;
export type Parsed<T> = {
	flags: FlagsObject<InferFlags<T>>;
	args: ArgsObject<InferArgs<T>>;
};
