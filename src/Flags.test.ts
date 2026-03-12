import { describe, expect, expectTypeOf, it } from 'vitest';

import { Args, FlagDefinition, Flags, getFlagDefaultValue, getFlagDefinition } from '@/src/Flags.js';
import {
	BooleanFlagDef,
	CustomFlagDef,
	DirectoryFlagDef,
	EnumFlagDef,
	FileFlagDef,
	FlagDefinition,
	FlagType,
	NumberFlagDef,
	StringFlagDef,
	UrlFlagDef,
} from '@/src/lib/types.js';

describe('Flags builders', () => {
	describe('Flags.string()', () => {
		it('should create a string flag definition', () => {
			const flag = Flags.string();
			expect(flag).toMatchObject({ type: 'string' });
			expect(typeof flag.parse).toBe('function');
		});

		it('should accept options', () => {
			const flag = Flags.string({ required: true, description: 'Name' });
			expect(flag).toMatchObject({ type: 'string', required: true, description: 'Name' });
		});

		it('should have correct type', () => {
			const flag = Flags.string();
			expectTypeOf(flag).toMatchTypeOf<StringFlagDef>();
		});
	});

	describe('Flags.number()', () => {
		it('should create a number flag definition', () => {
			const flag = Flags.number();
			expect(flag).toMatchObject({ type: 'number' });
			expect(typeof flag.parse).toBe('function');
		});

		it('should accept min/max options', () => {
			const flag = Flags.number({ min: 1, max: 65535, default: 3000 });
			expect(flag).toMatchObject({ type: 'number', min: 1, max: 65535, default: 3000 });
		});

		it('should have correct type', () => {
			const flag = Flags.number({ min: 1, max: 100 });
			expectTypeOf(flag).toMatchTypeOf<NumberFlagDef>();
		});
	});

	describe('Flags.boolean()', () => {
		it('should create a boolean flag definition', () => {
			const flag = Flags.boolean();
			expect(flag).toMatchObject({ type: 'boolean' });
			expect(typeof flag.parse).toBe('function');
		});

		it('should have correct type', () => {
			const flag = Flags.boolean();
			expectTypeOf(flag).toMatchTypeOf<BooleanFlagDef>();
		});
	});

	describe('Flags.enum()', () => {
		it('should create an enum flag definition', () => {
			const flag = Flags.enum({ options: ['debug', 'info', 'warn'] as const });
			expect(flag).toMatchObject({ type: 'enum', options: ['debug', 'info', 'warn'] });
			expect(typeof flag.parse).toBe('function');
		});

		it('should accept multiple option', () => {
			const flag = Flags.enum({ options: ['a', 'b'] as const, multiple: true });
			expect(flag).toMatchObject({ type: 'enum', options: ['a', 'b'], multiple: true });
		});

		it('should have correct type', () => {
			const flag = Flags.enum({ options: ['a', 'b'] as const });
			expectTypeOf(flag).toMatchTypeOf<EnumFlagDef>();
		});

		it('should infer enum values type', () => {
			const flag = Flags.enum({ options: ['debug', 'info', 'warn'] as const });
			type Result = FlagType<typeof flag>;
			expectTypeOf<Result>().toEqualTypeOf<'debug' | 'info' | 'warn'>();
		});
	});

	describe('Flags.file()', () => {
		it('should create a file flag definition', () => {
			const flag = Flags.file();
			expect(flag).toMatchObject({ type: 'file' });
			expect(typeof flag.parse).toBe('function');
		});

		it('should accept exists option', () => {
			const flag = Flags.file({ exists: true, required: true });
			expect(flag).toMatchObject({ type: 'file', exists: true, required: true });
		});

		it('should have correct type', () => {
			const flag = Flags.file();
			expectTypeOf(flag).toMatchTypeOf<FileFlagDef>();
		});
	});

	describe('Flags.directory()', () => {
		it('should create a directory flag definition', () => {
			const flag = Flags.directory();
			expect(flag).toMatchObject({ type: 'directory' });
			expect(typeof flag.parse).toBe('function');
		});

		it('should accept exists option', () => {
			const flag = Flags.directory({ exists: true });
			expect(flag).toMatchObject({ type: 'directory', exists: true });
		});

		it('should have correct type', () => {
			const flag = Flags.directory();
			expectTypeOf(flag).toMatchTypeOf<DirectoryFlagDef>();
		});
	});

	describe('Flags.url()', () => {
		it('should create a url flag definition', () => {
			const flag = Flags.url();
			expect(flag).toMatchObject({ type: 'url' });
			expect(typeof flag.parse).toBe('function');
		});

		it('should have correct type', () => {
			const flag = Flags.url();
			expectTypeOf(flag).toMatchTypeOf<UrlFlagDef>();
		});
	});

	describe('Flags.custom()', () => {
		it('should return a factory function', () => {
			const dateFlag = Flags.custom<Date>({
				parse: (v) => new Date(v),
			});
			expect(typeof dateFlag).toBe('function');
		});

		it('should create a custom flag definition from factory', () => {
			const dateFlag = Flags.custom<Date>({
				parse: (v) => new Date(v),
			});
			const flag = dateFlag({ required: true, description: 'start date' });
			expect(flag.type).toBe('custom');
			expect(flag.required).toBe(true);
			expect(flag.description).toBe('start date');
			expect(typeof flag.parse).toBe('function');
		});

		it('should preserve parse function from factory', () => {
			const parse = (v: string) => new Date(v);
			const dateFlag = Flags.custom<Date>({ parse });
			const flag = dateFlag();
			expect(flag.parse).toBe(parse);
		});

		it('should allow defaults to be overridden', () => {
			const dateFlag = Flags.custom<Date>({
				parse: (v) => new Date(v),
				description: 'default desc',
			});
			const flag = dateFlag({ description: 'overridden desc' });
			expect(flag.description).toBe('overridden desc');
		});

		it('should have correct type', () => {
			const dateFlag = Flags.custom<Date>({
				parse: (v) => new Date(v),
			});
			const flag = dateFlag();
			expectTypeOf(flag).toMatchTypeOf<CustomFlagDef<Date>>();
		});

		it('should infer custom return type', () => {
			const flag = Flags.custom<Date>({ parse: (v) => new Date(v) })();
			type Result = FlagType<typeof flag>;
			expectTypeOf<Result>().toEqualTypeOf<Date>();
		});
	});
});

describe('Args builders', () => {
	it('should be the same as Flags', () => {
		expect(Args).toBe(Flags);
	});

	it('should work for args', () => {
		const arg = Args.file({ exists: true, required: true });
		expect(arg).toMatchObject({ type: 'file', exists: true, required: true });
	});

	it('should work for enum args', () => {
		const arg = Args.enum({ options: ['json', 'csv'] as const });
		expect(arg).toMatchObject({ type: 'enum', options: ['json', 'csv'] });
	});
});

describe('Type inference', () => {
	it('should infer file as string', () => {
		const flag = Flags.file();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should infer directory as string', () => {
		const flag = Flags.directory();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should infer url as URL', () => {
		const flag = Flags.url();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<URL>();
	});

	it('should infer enum with multiple as array', () => {
		// Use plain object for type inference (builder return type doesn't narrow `multiple: true`)
		const flag = { type: 'enum', options: ['a', 'b'] as const, multiple: true } as const;
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<('a' | 'b')[]>();
	});

	it('should infer custom with multiple as array', () => {
		// Use plain object for type inference (builder return type doesn't narrow `multiple: true`)
		const flag = { type: 'custom', parse: (v: string) => new Date(v), multiple: true } as const;
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<Date[]>();
	});
});

describe('getFlagDefaultValue', () => {
	it('should return null for string type', () => {
		expect(getFlagDefaultValue({ type: 'string' })).toBe(null);
	});

	it('should return null for number type', () => {
		expect(getFlagDefaultValue({ type: 'number' })).toBe(null);
	});

	it('should return false for boolean type', () => {
		expect(getFlagDefaultValue({ type: 'boolean' })).toBe(false);
	});

	it('should return empty array for string array type', () => {
		expect(getFlagDefaultValue({ type: ['string'] })).toEqual([]);
	});

	it('should return empty array for number array type', () => {
		expect(getFlagDefaultValue({ type: ['number'] })).toEqual([]);
	});

	it('should use custom default from option definition', () => {
		expect(
			getFlagDefaultValue({
				type: 'string',
				default: 'custom',
			}),
		).toBe('custom');
	});

	it('should use custom numeric default', () => {
		expect(
			getFlagDefaultValue({
				type: 'number',
				default: 42,
			}),
		).toBe(42);
	});

	it('should use primitive default when no custom default', () => {
		expect(
			getFlagDefaultValue({
				type: 'boolean',
			}),
		).toBe(false);
	});
});

describe('getFlagDefinition', () => {
	it('should extract details from string flag', () => {
		const details = getFlagDefinition({ type: 'string' });

		expect(details).toMatchObject({
			alias: [],
			default: null,
			description: '',
			required: false,
			secret: false,
			type: 'string',
			variadic: false,
		});
		expect(typeof details.parse).toBe('function');
	});

	it('should extract details from number flag', () => {
		const details = getFlagDefinition({ type: 'number' });

		expect(details).toMatchObject({
			alias: [],
			default: null,
			description: '',
			required: false,
			secret: false,
			type: 'number',
			variadic: false,
		});
		expect(typeof details.parse).toBe('function');
	});

	it('should extract details from boolean flag', () => {
		const details = getFlagDefinition({ type: 'boolean' });

		expect(details).toMatchObject({
			alias: [],
			default: false,
			description: '',
			required: false,
			secret: false,
			type: 'boolean',
			variadic: false,
		});
		expect(typeof details.parse).toBe('function');
	});

	it('should extract details from array type', () => {
		const details = getFlagDefinition({ type: ['string'] });

		expect(details).toMatchObject({
			alias: [],
			default: [],
			description: '',
			required: false,
			secret: false,
			type: ['string'],
			variadic: false,
		});
		expect(typeof details.parse).toBe('function');
	});

	it('should extract details from full option definition', () => {
		const option: FlagDefinition = {
			type: 'string',
			description: 'Test option',
			alias: ['o'],
			required: true,
			secret: true,
			default: 'test',
			multiple: false,
		};

		const details = getFlagDefinition(option);

		expect(details).toMatchObject({
			type: 'string',
			description: 'Test option',
			alias: ['o'],
			required: true,
			secret: true,
			default: 'test',
			variadic: false,
		});
		expect(typeof details.parse).toBe('function');
	});

	it('should convert string alias to array', () => {
		const option: FlagDefinition = {
			type: 'string',
			alias: 'o',
		};

		const details = getFlagDefinition(option);

		expect(details.alias).toEqual(['o']);
	});

	it('should keep array alias as is', () => {
		const option: FlagDefinition = {
			type: 'string',
			alias: ['o', 'opt', 'option'],
		};

		const details = getFlagDefinition(option);

		expect(details.alias).toEqual(['o', 'opt', 'option']);
	});

	it('should handle empty alias', () => {
		const option: FlagDefinition = {
			type: 'string',
		};

		const details = getFlagDefinition(option);

		expect(details.alias).toEqual([]);
	});

	it('should use primitive default when option has no default', () => {
		const option: FlagDefinition = {
			type: 'boolean',
			description: 'Test',
		};

		const details = getFlagDefinition(option);

		expect(details.default).toBe(false);
	});

	it('should use option default over primitive default', () => {
		const option: FlagDefinition = {
			type: 'boolean',
			default: true,
		};

		const details = getFlagDefinition(option);

		expect(details.default).toBe(true);
	});

	it('should handle variadic flag', () => {
		const option: FlagDefinition = {
			type: ['string'],
			multiple: true,
		};

		const details = getFlagDefinition(option);

		expect(details.multiple).toBe(true);
	});

	it('should default variadic to false', () => {
		const option: FlagDefinition = {
			type: 'string',
		};

		const details = getFlagDefinition(option);

		expect(details.multiple).toBe(false);
	});

	it('should default required to false', () => {
		const option: FlagDefinition = {
			type: 'string',
		};

		const details = getFlagDefinition(option);

		expect(details.required).toBe(false);
	});

	it('should handle empty description', () => {
		const option: FlagDefinition = {
			type: 'string',
		};

		const details = getFlagDefinition(option);

		expect(details.description).toBe('');
	});

	it('should extract number min/max', () => {
		const option: FlagDefinition = {
			type: 'number',
			min: 1,
			max: 65535,
		};

		const details = getFlagDefinition(option);

		expect(details.type).toBe('number');
		expect(details.min).toBe(1);
		expect(details.max).toBe(65535);
	});

	it('should extract enum options', () => {
		const option: FlagDefinition = {
			type: 'enum',
			options: ['debug', 'info', 'warn'] as const,
		};

		const details = getFlagDefinition(option);

		expect(details.type).toBe('enum');
		expect(details.options).toEqual(['debug', 'info', 'warn']);
		expect(details.default).toBeNull();
	});

	it('should extract enum with multiple', () => {
		const option: FlagDefinition = {
			type: 'enum',
			options: ['a', 'b'] as const,
			multiple: true,
		};

		const details = getFlagDefinition(option);

		expect(details.multiple).toBe(true);
		expect(details.default).toEqual([]);
	});

	it('should extract file exists', () => {
		const option: FlagDefinition = {
			type: 'file',
			exists: true,
		};

		const details = getFlagDefinition(option);

		expect(details.type).toBe('file');
		expect(details.exists).toBe(true);
		expect(details.default).toBeNull();
	});

	it('should extract directory exists', () => {
		const option: FlagDefinition = {
			type: 'directory',
			exists: true,
		};

		const details = getFlagDefinition(option);

		expect(details.type).toBe('directory');
		expect(details.exists).toBe(true);
	});

	it('should extract url type', () => {
		const option: FlagDefinition = { type: 'url' };

		const details = getFlagDefinition(option);

		expect(details.type).toBe('url');
		expect(details.default).toBeNull();
	});

	it('should extract custom parse and validate', () => {
		const parse = (v: string) => new Date(v);
		const validate = (v: Date) => (isNaN(v.getTime()) ? 'Invalid date' : (true as const));
		const option: FlagDefinition = {
			type: 'custom',
			parse,
			validate,
		};

		const details = getFlagDefinition(option);

		expect(details.type).toBe('custom');
		expect(details.parse).toBe(parse);
		expect(details.validate).toBe(validate);
		expect(details.default).toBeNull();
	});

	it('should extract custom with multiple', () => {
		const option: FlagDefinition = {
			type: 'custom',
			parse: (v: string) => parseInt(v),
			multiple: true,
		};

		const details = getFlagDefinition(option);

		expect(details.multiple).toBe(true);
		expect(details.default).toEqual([]);
	});

	it('should always have a parse function', () => {
		expect(typeof getFlagDefinition({ type: 'string' }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: 'number' }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: 'boolean' }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: ['string'] }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: ['number'] }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: 'enum', options: ['a'] as const }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: 'file' }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: 'directory' }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: 'url' }).parse).toBe('function');
		expect(typeof getFlagDefinition({ type: 'custom', parse: (v: string) => v }).parse).toBe('function');
	});
});
