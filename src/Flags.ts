import fs from 'node:fs';

import type { BooleanFlagDef, CustomFlagDef, DirectoryFlagDef, EnumFlagDef, FileFlagDef, NumberFlagDef, StringFlagDef, UrlFlagDef } from '@/src/lib/types.js';

export const Flags = {
	string(opts?: Partial<Omit<StringFlagDef, 'type'>>): StringFlagDef {
		return {
			...opts,
			type: 'string',
			parse: (value: any): string => String(value),
		};
	},

	number(opts?: Partial<Omit<NumberFlagDef, 'type'>>): NumberFlagDef {
		return {
			...opts,
			type: 'number',
			parse: (value: any) => {
				const parsed = typeof value === 'number' ? value : Number(value);
				if (isNaN(parsed)) throw new Error(`Invalid number: ${value}`);
				if (opts?.min !== undefined && parsed < opts.min) throw new Error(`Value ${parsed} is below minimum ${opts.min}`);
				if (opts?.max !== undefined && parsed > opts.max) throw new Error(`Value ${parsed} exceeds maximum ${opts.max}`);
				return parsed;
			},
		};
	},

	boolean(opts?: Partial<Omit<BooleanFlagDef, 'type'>>): BooleanFlagDef {
		return {
			...opts,
			type: 'boolean',
			parse: (value: any): boolean => {
				if (typeof value === 'boolean') return value;
				const val = String(value).toLowerCase();
				if (val === 'true' || val === '1') return true;
				if (val === 'false' || val === '0') return false;
				return Boolean(value);
			},
		};
	},

	enum<const T extends readonly string[]>(
		opts: {
			options: T;
		} & Partial<Omit<EnumFlagDef<T>, 'type' | 'options'>>,
	): EnumFlagDef<T> {
		return {
			...opts,
			type: 'enum',
			parse: (value: any) => {
				const str = String(value);
				if (!opts.options.includes(str)) throw new Error(`Expected one of [${opts.options.join(', ')}], got "${str}"`);
				return str as unknown as T;
			},
		};
	},

	file(opts?: Partial<Omit<FileFlagDef, 'type'>>): FileFlagDef {
		return {
			...opts,
			type: 'file',
			parse: (input: any) => {
				if (!fs.existsSync(input)) {
					throw new Error(`File not found: "${input}"`);
				}
				return String(input);
			},
		};
	},

	directory(opts?: Partial<Omit<DirectoryFlagDef, 'type'>>): DirectoryFlagDef {
		return {
			...opts,
			type: 'directory',
			parse: (input: any) => {
				if (!fs.existsSync(input) || !fs.statSync(input).isDirectory()) {
					throw new Error(`Directory not found: "${input}"`);
				}
				return String(input);
			},
		};
	},

	url(opts?: Partial<Omit<UrlFlagDef, 'type'>>): UrlFlagDef {
		return {
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
		};
	},

	custom<T>(
		defaults: { parse: (value: string) => T } & Partial<Omit<CustomFlagDef<T>, 'type' | 'parse'>>,
	): (overrides?: Partial<Omit<CustomFlagDef<T>, 'type' | 'parse'>>) => CustomFlagDef<T> {
		return (overrides?) => ({
			...defaults,
			...overrides,
			type: 'custom',
			parse: defaults.parse,
		});
	},
};

export const Args = Flags;
