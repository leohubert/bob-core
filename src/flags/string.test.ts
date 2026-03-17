import { describe, expect, expectTypeOf, it } from 'vitest';

import { Flags } from '@/src/flags/index.js';
import type { FlagReturnType, FlagType, StringFlagDef } from '@/src/lib/types.js';

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

	it('should default to null for single', () => {
		const flag = Flags.string();
		expect(flag.default).toBeNull();
	});

	it('should default to empty array for multiple', () => {
		const flag = Flags.string({ multiple: true });
		expect(flag.default).toEqual([]);
	});

	it('should parse string values', () => {
		const flag = Flags.string();
		expect(flag.parse('hello', undefined)).toBe('hello');
	});

	it('should throw on boolean input', () => {
		const flag = Flags.string();
		expect(() => flag.parse(true as any, undefined)).toThrow('Expected a string, got boolean');
	});

	it('should infer string with multiple as array', () => {
		const _flag = Flags.string({ multiple: true });
		type Result = FlagType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string[]>();
	});

	it('should remove null from required string flag', () => {
		const _flag = Flags.string({ required: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should include null for optional flag', () => {
		const _flag = Flags.string();
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string | null>();
	});
});
