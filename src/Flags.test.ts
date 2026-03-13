import { describe, expect, expectTypeOf, it } from 'vitest';

import { Args, Flags } from '@/src/Flags.js';
import {
	BooleanFlagDef,
	CustomFlagDef,
	DirectoryFlagDef,
	EnumFlagDef,
	FileFlagDef,
	FlagReturnType,
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
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				parse: v => new Date(v),
			});
			expect(typeof dateFlag).toBe('function');
		});

		it('should create a custom flag definition from factory', () => {
			const dateFlag = Flags.custom<Date>({
				parse: v => new Date(v),
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
				parse: v => new Date(v),
				description: 'default desc',
			});
			const flag = dateFlag({ description: 'overridden desc' });
			expect(flag.description).toBe('overridden desc');
		});

		it('should have correct type', () => {
			const dateFlag = Flags.custom<Date>({
				parse: v => new Date(v),
			});
			const flag = dateFlag();
			expectTypeOf(flag).toMatchTypeOf<CustomFlagDef<Date>>();
		});

		it('should infer custom return type', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const flag = Flags.custom<Date>({ parse: v => new Date(v) })();
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.file();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should infer directory as string', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.directory();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should infer url as URL', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.url();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<URL>();
	});

	it('should infer enum with multiple as array', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.enum({ options: ['a', 'b'] as const, multiple: true });
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<('a' | 'b')[]>();
	});

	it('should infer custom with multiple as array', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.custom<Date>({ parse: v => new Date(v) })({ multiple: true });
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<Date[]>();
	});

	it('should infer string with multiple as array', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.string({ multiple: true });
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string[]>();
	});

	it('should infer number with multiple as array', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.number({ multiple: true });
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<number[]>();
	});

	it('should remove null from required string flag', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.string({ required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should remove null from required number flag', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.number({ required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<number>();
	});

	it('should remove null from required enum flag', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.enum({ options: ['a', 'b'] as const, required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<'a' | 'b'>();
	});

	it('should remove null from required file flag', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.file({ required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should remove null from required custom flag', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.custom<Date>({ parse: v => new Date(v) })({ required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<Date>();
	});

	it('should include null for optional flag', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.string();
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string | null>();
	});

	it('should remove null from required multiple number flag', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.number({ required: true, multiple: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<number[]>();
	});
});
