import { describe, expect, expectTypeOf, it } from 'vitest';

import { newFlagOpts } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition, FlagReturnType, ParameterOpts } from '@/src/lib/types.js';

describe('Flags.boolean()', () => {
	let flagOpts: ParameterOpts;

	it('should create a boolean flag definition', () => {
		const flag = Flags.boolean();
		expect(flag).toMatchObject({ type: 'boolean' });
		expect(typeof flag.parse).toBe('function');
	});

	it('should have correct type', () => {
		const flag = Flags.boolean();
		expectTypeOf(flag).toMatchTypeOf<FlagDefinition & { type: 'boolean' }>();
	});

	it('should default to false', () => {
		const flag = Flags.boolean();
		expect(flag.default).toBe(false);
	});

	it('should parse boolean values', () => {
		const flag = Flags.boolean();
		flagOpts = newFlagOpts(flag);
		expect(flag.parse(true, flagOpts)).toBe(true);
		expect(flag.parse(false, flagOpts)).toBe(false);
	});

	it('should parse string values', () => {
		const flag = Flags.boolean();
		flagOpts = newFlagOpts(flag);
		expect(flag.parse('true', flagOpts)).toBe(true);
		expect(flag.parse('false', flagOpts)).toBe(false);
		expect(flag.parse('1', flagOpts)).toBe(true);
		expect(flag.parse('0', flagOpts)).toBe(false);
	});

	it('should always be non-nullable (has default: false)', () => {
		const _flag = Flags.boolean();
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<boolean>();
	});
});
