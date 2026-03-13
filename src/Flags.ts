import fs from 'node:fs';

import {
	BooleanFlagDef,
	CustomFlagDef,
	DirectoryFlagDef,
	EnumFlagDef,
	FileFlagDef,
	FlagInput,
	FlagValidationResult,
	NumberFlagDef,
	StringFlagDef,
	UrlFlagDef,
} from '@/src/lib/types.js';

export const Flags = {
	string<const T extends FlagInput<StringFlagDef>>(opts?: T): StringFlagDef & T {
		return {
			default: opts?.multiple ? [] : null,
			parse: (value: any): string => {
				if (typeof value === 'boolean') {
					throw new Error(`Expected a string, got boolean "${value}"`);
				}
				return String(value);
			},
			...opts,
			type: 'string',
		} as StringFlagDef & T;
	},

	number<const T extends FlagInput<NumberFlagDef>>(opts?: T): NumberFlagDef & T {
		return {
			default: opts?.multiple ? [] : null,
			validate(value: number) {
				if (opts?.min !== undefined && value < opts.min) return `is below minimum ${opts.min}`;
				if (opts?.max !== undefined && value > opts.max) return `exceeds maximum ${opts.max}`;
				return true;
			},
			parse: (value: any): number => {
				const num = typeof value === 'number' ? value : Number(value);
				if (isNaN(num)) {
					throw new Error(`must be a valid number`);
				}
				return num;
			},
			...opts,
			type: 'number',
		} as NumberFlagDef & T;
	},

	boolean<const T extends FlagInput<BooleanFlagDef>>(opts?: T): BooleanFlagDef & T {
		return {
			default: false,
			parse: (value: any): boolean => {
				if (typeof value === 'boolean') return value;
				const val = String(value).toLowerCase();
				if (val === 'true' || val === '1') return true;
				if (val === 'false' || val === '0') return false;
				return Boolean(value);
			},
			...opts,
			type: 'boolean',
		} as BooleanFlagDef & T;
	},

	enum<const T extends readonly string[], const U extends FlagInput<EnumFlagDef<T>, 'options'>>(opts: { options: T } & U): EnumFlagDef<T> & U {
		return {
			default: opts.multiple ? [] : null,
			validate(value: T[number]) {
				if (!opts.options.includes(value)) {
					return `must be one of: ${opts.options.map(o => `"${o}"`).join(', ')}`;
				}
				return true;
			},
			parse: (value: any): T[number] => {
				return String(value) as T[number];
			},
			...opts,
			type: 'enum',
		} as EnumFlagDef<T> & U;
	},

	file<const T extends FlagInput<FileFlagDef>>(opts?: T): FileFlagDef & T {
		return {
			default: null,
			parse: (input: any) => String(input),
			validate(value: string): FlagValidationResult {
				if (opts?.exists) {
					const isFileExist = fs.existsSync(value);
					if (!isFileExist) {
						return `file does not exist`;
					}
				}
				return true;
			},
			...opts,
			type: 'file',
		} as FileFlagDef & T;
	},

	directory<const T extends FlagInput<DirectoryFlagDef>>(opts?: T): DirectoryFlagDef & T {
		return {
			default: null,
			parse: (input: any) => String(input),
			validate(value: string): FlagValidationResult {
				if (opts?.exists) {
					const isDirectoryExist = fs.existsSync(value) && fs.lstatSync(value).isDirectory();
					if (!isDirectoryExist) {
						return `directory does not exist`;
					}
				}
				return true;
			},
			...opts,
			type: 'directory',
		} as DirectoryFlagDef & T;
	},

	url<const T extends FlagInput<UrlFlagDef>>(opts?: T): UrlFlagDef & T {
		return {
			default: null,
			parse: (input: any) => {
				return new URL(String(input));
			},
			...opts,
			type: 'url',
		} as UrlFlagDef & T;
	},

	custom<T>(defaults?: FlagInput<CustomFlagDef<T>>): <const U extends FlagInput<CustomFlagDef<T>>>(overrides?: U) => CustomFlagDef<T> & U {
		return <const U extends FlagInput<CustomFlagDef<T>>>(overrides?: U) =>
			({
				default: defaults?.multiple || overrides?.multiple ? [] : null,
				parse: (input: any) => input,
				...defaults,
				...overrides,
				type: 'custom',
			}) as CustomFlagDef<T> & U;
	},
};

export const Args = Flags;
