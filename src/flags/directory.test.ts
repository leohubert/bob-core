import { describe, expect, expectTypeOf, it } from 'vitest';

import { newFlagOpts } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition, FlagReturnType, FlagType, ParameterOpts } from '@/src/lib/types.js';

describe('Flags.directory()', () => {
	let flagOpts: ParameterOpts;

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
		expectTypeOf(flag).toMatchTypeOf<FlagDefinition>();
	});

	it('should infer directory as string', () => {
		const _flag = Flags.directory();
		type Result = FlagType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should reject non-existent directory in parse', () => {
		const flag = Flags.directory({ exists: true });
		flagOpts = newFlagOpts(flag);
		expect(() => flag.parse('/nonexistent/dir', flagOpts)).toThrow('directory does not exist');
	});

	it('should remove null from defaulted directory flag', () => {
		const _flag = Flags.directory({ default: '/tmp' });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should remove null from required directory flag', () => {
		const _flag = Flags.directory({ required: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});
});
