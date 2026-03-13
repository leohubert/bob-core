import type { BooleanFlagDef, CustomFlagDef, DirectoryFlagDef, EnumFlagDef, FileFlagDef, NumberFlagDef, StringFlagDef, UrlFlagDef } from '@/src/lib/types.js';

export const Flags = {
	string<const T extends Partial<Omit<StringFlagDef, 'type'>> = {}>(opts?: T): StringFlagDef & T {
		return {
			default: opts?.multiple ? ([] as any) : null,
			...opts,
			type: 'string',
			parse: (value: any): string => String(value),
		} as any;
	},

	number<const T extends Partial<Omit<NumberFlagDef, 'type'>> = {}>(opts?: T): NumberFlagDef & T {
		return {
			default: opts?.multiple ? ([] as any) : null,
			...opts,
			type: 'number',
			parse: (value: any) => {
				const parsed = typeof value === 'number' ? value : Number(value);
				if (isNaN(parsed)) throw new Error(`Invalid number: ${value}`);
				if (opts?.min !== undefined && parsed < opts.min) throw new Error(`Value ${parsed} is below minimum ${opts.min}`);
				if (opts?.max !== undefined && parsed > opts.max) throw new Error(`Value ${parsed} exceeds maximum ${opts.max}`);
				return parsed;
			},
		} as any;
	},

	boolean<const T extends Partial<Omit<BooleanFlagDef, 'type'>> = {}>(opts?: T): BooleanFlagDef & T {
		return {
			default: false,
			...opts,
			type: 'boolean',
			parse: (value: any): boolean => {
				if (typeof value === 'boolean') return value;
				const val = String(value).toLowerCase();
				if (val === 'true' || val === '1') return true;
				if (val === 'false' || val === '0') return false;
				return Boolean(value);
			},
		} as any;
	},

	enum<const T extends readonly string[], const U extends Partial<Omit<EnumFlagDef<T>, 'type' | 'options'>> = {}>(
		opts: { options: T } & U,
	): EnumFlagDef<T> & U {
		return {
			default: opts.multiple ? ([] as any) : null,
			...opts,
			type: 'enum',
			parse: (value: any) => {
				const str = String(value);
				if (!opts.options.includes(str)) throw new Error(`Expected one of [${opts.options.join(', ')}], got "${str}"`);
				return str as unknown as T;
			},
		} as any;
	},

	file<const T extends Partial<Omit<FileFlagDef, 'type'>> = {}>(opts?: T): FileFlagDef & T {
		return {
			default: null,
			...opts,
			type: 'file',
			parse: (input: any) => String(input),
		} as any;
	},

	directory<const T extends Partial<Omit<DirectoryFlagDef, 'type'>> = {}>(opts?: T): DirectoryFlagDef & T {
		return {
			default: null,
			...opts,
			type: 'directory',
			parse: (input: any) => String(input),
		} as any;
	},

	url<const T extends Partial<Omit<UrlFlagDef, 'type'>> = {}>(opts?: T): UrlFlagDef & T {
		return {
			default: null,
			...opts,
			type: 'url',
			parse: (input: any) => {
				const str = String(input);
				try {
					return new URL(str);
				} catch {
					throw new Error(`Invalid URL: "${str}"`);
				}
			},
		} as any;
	},

	custom<T>(
		defaults: { parse: (value: string) => T } & Partial<Omit<CustomFlagDef<T>, 'type' | 'parse'>>,
	): <const U extends Partial<Omit<CustomFlagDef<T>, 'type' | 'parse'>> = {}>(overrides?: U) => CustomFlagDef<T> & U {
		return (overrides?) => ({
			default: (defaults.multiple || overrides?.multiple ? [] : null) as any,
			...defaults,
			...overrides,
			type: 'custom',
			parse: defaults.parse,
		}) as any;
	},
};

export const Args = Flags;
