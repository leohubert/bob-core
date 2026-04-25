import { Command } from '@/src/Command.js';
import type { UX } from '@/src/ux/index.js';

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
	type?: 'string' | 'number' | 'boolean' | 'option' | 'file' | 'directory' | 'url' | 'custom';
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

export type FlagType<O> = O extends { parse: (...args: any[]) => infer R }
	? O extends { multiple: true }
		? [R] extends [Array<unknown>]
			? R
			: R[]
		: R
	: never;

type DefaultResolvedType<D> = D extends (...args: any[]) => infer R ? Awaited<R> : D;

type IsGuaranteed<O> = O extends { required: true }
	? true
	: O extends { multiple: true }
		? true
		: O extends { default: infer D }
			? [Exclude<DefaultResolvedType<D>, undefined>] extends [never]
				? false
				: null extends Exclude<DefaultResolvedType<D>, undefined>
					? false
					: true
			: false;

export type FlagReturnType<O> = IsGuaranteed<O> extends true ? FlagType<O> : FlagType<O> | null;

// === Schema types ===

export type FlagsSchema = {
	[key: string]: FlagDefinition;
};

export type FlagsObject<Options extends FlagsSchema> = {
	[Key in keyof Options]: FlagReturnType<Options[Key]>;
};

export type ArgsSchema = FlagsSchema;

// === Parsed type ===

export type InferFlags<T> = T extends { flags: infer O extends FlagsSchema } ? O : FlagsSchema;
export type InferArgs<T> = T extends { args: infer A extends ArgsSchema } ? A : ArgsSchema;
export type Parsed<T> = {
	flags: FlagsObject<InferFlags<T>>;
	args: FlagsObject<InferArgs<T>>;
};
