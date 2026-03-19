import { Command } from '@/src/Command.js';
import type { UX } from '@/src/ux/index.js';

// === HasDefault branded type ===
declare const hasDefaultBrand: unique symbol;
export type HasDefault = { readonly [hasDefaultBrand]: true };

export type FlagOpts<C extends ContextDefinition = ContextDefinition> = {
	name: string;
	ux: UX;
	ctx: C;
	definition: FlagDefinition;
	cmd: typeof Command;
};

export type BaseFlagConfig<T, Input = string> = {
	description?: string;
	alias?: string | Array<string>;
	required?: boolean;
	default?: T | T[] | null | (() => Promise<T | T[] | null>);
	multiple?: boolean;
	help?: string;
	parse(input: Input, opts: FlagOpts): T;
	handler?(value: T, opts: FlagOpts): { shouldStop: boolean } | void;
	ask?(opts: FlagOpts): Promise<T | T[] | null>;
};

// === Per-type definitions (discriminated union members) ===

export type StringFlagDef = BaseFlagConfig<string> & { type: 'string'; secret?: boolean };
export type NumberFlagDef = BaseFlagConfig<number, string | number> & { type: 'number'; min?: number; max?: number };
export type BooleanFlagDef = BaseFlagConfig<boolean, string | boolean> & { type: 'boolean' };

export type EnumFlagDef<T extends readonly string[] = readonly string[]> = BaseFlagConfig<T[number]> & {
	type: 'enum';
	options: T;
};

export type FileFlagDef = BaseFlagConfig<string> & { type: 'file'; exists?: boolean };
export type DirectoryFlagDef = BaseFlagConfig<string> & { type: 'directory'; exists?: boolean };
export type UrlFlagDef = BaseFlagConfig<URL> & { type: 'url' };

export type CustomFlagDef<R = unknown> = BaseFlagConfig<R> & { type: 'custom' };

// === Flag = discriminated union of all definitions ===

export type FlagDefinition = StringFlagDef | NumberFlagDef | BooleanFlagDef | EnumFlagDef | FileFlagDef | DirectoryFlagDef | UrlFlagDef | CustomFlagDef<any>;

export type FlagInput<T extends FlagDefinition, K extends string = never> = Partial<Omit<T, 'type' | K>>;

// === Type inference ===

type MaybeArray<T, O> = O extends { multiple: true } ? ([T] extends [Array<unknown>] ? T : T[]) : T;

type InferParseReturn<O> = O extends { parse: (...args: any[]) => infer R } ? R : never;

export type FlagType<O extends FlagDefinition> = O extends {
	type: 'enum';
	options: infer T extends readonly string[];
}
	? MaybeArray<T[number], O>
	: MaybeArray<InferParseReturn<O>, O>;

export type IsGuaranteed<O extends FlagDefinition> = O extends { required: true } ? true : O extends HasDefault ? true : false;

export type FlagReturnType<O extends FlagDefinition> = IsGuaranteed<O> extends true ? FlagType<O> : FlagType<O> | null;

export type FlagsSchema = {
	[key: string]: FlagDefinition;
};

export type FlagsObject<Options extends FlagsSchema> = {
	[Key in keyof Options]: FlagReturnType<Options[Key]>;
};

export type ArgumentsSchema = {
	[key: string]: FlagDefinition;
};

export type ArgumentsObject<Arguments extends ArgumentsSchema> = {
	[Key in keyof Arguments]: FlagReturnType<Arguments[Key]>;
};

export type ContextDefinition = any;

export type InferFlags<T> = T extends { flags: infer O extends FlagsSchema } ? O : FlagsSchema;
export type InferArgs<T> = T extends { args: infer A extends ArgumentsSchema } ? A : ArgumentsSchema;
export type Parsed<T> = {
	flags: FlagsObject<InferFlags<T>>;
	args: ArgumentsObject<InferArgs<T>>;
};
