// === Base config shared by all flag definition types ===
import { Command } from '@/src/Command.js';

export type BaseFlagConfig<T> = {
	description?: string;
	alias?: string | Array<string>;
	required?: boolean;
	secret?: boolean;
	default?: T | null;
	parse: (input: any, ctx: ContextDefinition, cmd: typeof Command) => T;
	handlers?(value: T, ctx: ContextDefinition, cmd: typeof Command): { shouldStop: boolean };
};

// === Per-type definitions (discriminated union members) ===

export type StringFlagDef = BaseFlagConfig<string> & { type: 'string'; multiple?: boolean };
export type NumberFlagDef = BaseFlagConfig<number> & { type: 'number'; multiple?: boolean; min?: number; max?: number };
export type BooleanFlagDef = BaseFlagConfig<boolean> & { type: 'boolean' };

export type EnumFlagDef<T extends readonly string[] = readonly string[]> = BaseFlagConfig<T> & {
	type: 'enum';
	options: T;
	multiple?: boolean;
};

export type FileFlagDef = BaseFlagConfig<string> & { type: 'file'; multiple?: boolean; exists?: boolean };
export type DirectoryFlagDef = BaseFlagConfig<string> & { type: 'directory'; multiple?: boolean; exists?: boolean };
export type UrlFlagDef = BaseFlagConfig<URL> & { type: 'url'; multiple?: boolean };

export type CustomFlagDef<R = unknown> = BaseFlagConfig<R> & {
	type: 'custom';
	parse: (value: string) => R;
	validate?: (value: R) => true | string | Promise<true | string>;
	multiple?: boolean;
};

// === Flag = discriminated union of all definitions ===

export type FlagDefinition = StringFlagDef | NumberFlagDef | BooleanFlagDef | EnumFlagDef | FileFlagDef | DirectoryFlagDef | UrlFlagDef | CustomFlagDef<any>;

// === Type inference ===

export type FlagType<O extends FlagDefinition> = O extends {
	type: 'enum';
	options: infer T extends readonly string[];
	multiple: true;
}
	? T[number][]
	: O extends { type: 'enum'; options: infer T extends readonly string[] }
		? T[number]
		: O extends { type: 'file' | 'directory'; multiple: true }
			? string[]
			: O extends { type: 'file' | 'directory' }
				? string
				: O extends { type: 'custom'; parse: (value: string) => infer R; multiple: true }
					? R[]
					: O extends { type: 'custom'; parse: (value: string) => infer R }
						? R
						: O extends { type: 'url' }
							? URL
							: O extends { type: 'url'; multiple: true }
								? URL[]
								: O extends { type: 'number' }
									? number
									: O extends { type: 'number'; multiple: true }
										? number
										: O extends { type: infer R }
											? R
											: O extends { type: infer R; multiple: true }
												? R[]
												: never;

export type IsRequired<O extends FlagDefinition> = O extends { required: true } ? true : false;

export type FlagReturnType<O extends FlagDefinition> = IsRequired<O> extends true ? FlagType<O> : FlagType<O> | null;

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

export type InferFlags<T> = T extends { flags: infer O extends FlagsSchema } ? O : any;
export type InferArgs<T> = T extends { args: infer A extends ArgumentsSchema } ? A : any;
export type Parsed<T> = {
	flags: FlagsObject<InferFlags<T>>;
	args: ArgumentsObject<InferArgs<T>>;
};
