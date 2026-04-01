import { describe, expect, expectTypeOf, it } from 'vitest';

import { newFlagOpts } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition, FlagReturnType, FlagType, ParameterOpts } from '@/src/lib/types.js';

describe('Flags.file()', () => {
	let flagOpts: ParameterOpts;

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
		expectTypeOf(flag).toMatchTypeOf<FlagDefinition>();
	});

	it('should infer file as string', () => {
		const _flag = Flags.file();
		type Result = FlagType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should remove null from required file flag', () => {
		const _flag = Flags.file({ required: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should reject non-existent file in parse', () => {
		const flag = Flags.file({ exists: true });
		flagOpts = newFlagOpts(flag);
		expect(() => flag.parse('/nonexistent/path.txt', flagOpts)).toThrow('file does not exist');
	});

	it('should remove null from defaulted file flag', () => {
		const _flag = Flags.file({ default: '/tmp/config.json' });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});
});
