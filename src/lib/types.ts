import { Command } from '@/src/Command.js';
import type { UX } from '@/src/ux/index.js';

// === IsGuaranteed structural check ===

type HasExplicitDefault<O> = O extends { default: infer D } ? (undefined extends D ? false : null extends D ? false : true) : false;

export type ContextDefinition = any;

// === Shared config (internal base for both flags and args) ===

type SharedConfig<T, Input = string> = {
	description?: string;
	required?: boolean;
	default?: T | T[] | null | (() => Promise<T | T[] | null>);
	multiple?: boolean;
	help?: string;
	parse(input: Input, opts: FlagOpts | ArgOpts): T;
	ask?(opts: FlagOpts | ArgOpts): Promise<T | T[] | null>;
};

// === Flag-specific base ===

export type BaseFlagConfig<T, Input = string> = SharedConfig<T, Input> & {
	alias?: string | Array<string>;
	handler?(value: T, opts: FlagOpts): { shouldStop: boolean } | void;
};

// === Arg-specific base ===

export type BaseArgConfig<T, Input = string> = SharedConfig<T, Input> & {};

// === Opts types ===

export type FlagOpts<C extends ContextDefinition = ContextDefinition> = {
	name: string;
	ux: UX;
	ctx: C;
	definition: FlagDefinition;
	cmd: typeof Command;
};

export type ArgOpts<C extends ContextDefinition = ContextDefinition> = {
	name: string;
	ux: UX;
	ctx: C;
	definition: ArgDefinition;
	cmd: typeof Command;
};

// === Flag definitions (discriminated union members) ===

export type StringFlagDef = BaseFlagConfig<string> & { type: 'string'; secret?: boolean };
export type NumberFlagDef = BaseFlagConfig<number, string | number> & { type: 'number'; min?: number; max?: number };
export type BooleanFlagDef = BaseFlagConfig<boolean, string | boolean> & { type: 'boolean' };

export type OptionFlagDef<T extends readonly string[] = readonly string[]> = BaseFlagConfig<T[number]> & {
	type: 'option';
	options: T;
};

export type FileFlagDef = BaseFlagConfig<string> & { type: 'file'; exists?: boolean };
export type DirectoryFlagDef = BaseFlagConfig<string> & { type: 'directory'; exists?: boolean };
export type UrlFlagDef = BaseFlagConfig<URL> & { type: 'url' };

export type CustomFlagDef<R = unknown> = BaseFlagConfig<R> & { type: 'custom' };

export type FlagDefinition = StringFlagDef | NumberFlagDef | BooleanFlagDef | OptionFlagDef | FileFlagDef | DirectoryFlagDef | UrlFlagDef | CustomFlagDef<any>;

export type FlagInput<T extends FlagDefinition, K extends string = never> = Partial<Omit<T, 'type' | K>>;

// === Arg definitions (discriminated union members) ===

export type StringArgDef = BaseArgConfig<string> & { type: 'string' };
export type NumberArgDef = BaseArgConfig<number, string | number> & { type: 'number'; min?: number; max?: number };

export type OptionArgDef<T extends readonly string[] = readonly string[]> = BaseArgConfig<T[number]> & {
	type: 'option';
	options: T;
};

export type FileArgDef = BaseArgConfig<string> & { type: 'file'; exists?: boolean };
export type DirectoryArgDef = BaseArgConfig<string> & { type: 'directory'; exists?: boolean };
export type UrlArgDef = BaseArgConfig<URL> & { type: 'url' };

export type CustomArgDef<R = unknown> = BaseArgConfig<R> & { type: 'custom' };

export type ArgDefinition = StringArgDef | NumberArgDef | OptionArgDef | FileArgDef | DirectoryArgDef | UrlArgDef | CustomArgDef<any>;

export type ArgInput<T extends ArgDefinition, K extends string = never> = Partial<Omit<T, 'type' | K>>;

// === Flag type inference ===

type MaybeArray<T, O> = O extends { multiple: true } ? ([T] extends [Array<unknown>] ? T : T[]) : T;

type InferParseReturn<O> = O extends { parse: (...args: any[]) => infer R } ? R : never;

export type FlagType<O extends FlagDefinition> = O extends {
	type: 'option';
	options: infer T extends readonly string[];
}
	? MaybeArray<T[number], O>
	: MaybeArray<InferParseReturn<O>, O>;

export type IsGuaranteed<O extends FlagDefinition | ArgDefinition> = O extends { type: 'boolean' }
	? true
	: O extends { required: true }
		? true
		: O extends { multiple: true }
			? true
			: HasExplicitDefault<O> extends true
				? true
				: false;

export type FlagReturnType<O extends FlagDefinition> = IsGuaranteed<O> extends true ? FlagType<O> : FlagType<O> | null;

// === Arg type inference ===

export type ArgType<O extends ArgDefinition> = O extends {
	type: 'option';
	options: infer T extends readonly string[];
}
	? MaybeArray<T[number], O>
	: MaybeArray<InferParseReturn<O>, O>;

export type ArgReturnType<O extends ArgDefinition> = IsGuaranteed<O> extends true ? ArgType<O> : ArgType<O> | null;

// === Schema types ===

export type FlagsSchema = {
	[key: string]: FlagDefinition;
};

export type FlagsObject<Options extends FlagsSchema> = {
	[Key in keyof Options]: FlagReturnType<Options[Key]>;
};

export type ArgsSchema = {
	[key: string]: ArgDefinition;
};

export type ArgsObject<Arguments extends ArgsSchema> = {
	[Key in keyof Arguments]: ArgReturnType<Arguments[Key]>;
};

// === Parsed type ===

export type InferFlags<T> = T extends { flags: infer O extends FlagsSchema } ? O : FlagsSchema;
export type InferArgs<T> = T extends { args: infer A extends ArgsSchema } ? A : ArgsSchema;
export type Parsed<T> = {
	flags: FlagsObject<InferFlags<T>>;
	args: ArgsObject<InferArgs<T>>;
};
