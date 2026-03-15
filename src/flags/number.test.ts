import { describe, expect, expectTypeOf, it } from 'vitest';

import { Flags } from '@/src/flags/index.js';
import type { FlagReturnType, FlagType, NumberFlagDef } from '@/src/lib/types.js';

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

	it('should parse numeric strings', () => {
		const flag = Flags.number();
		expect(flag.parse('42', undefined)).toBe(42);
	});

	it('should throw on non-numeric input', () => {
		const flag = Flags.number();
		expect(() => flag.parse('abc', undefined)).toThrow('must be a valid number');
	});

	it('should reject below min in parse', () => {
		const flag = Flags.number({ min: 5 });
		expect(() => flag.parse('3', undefined)).toThrow('is below minimum 5');
	});

	it('should reject above max in parse', () => {
		const flag = Flags.number({ max: 10 });
		expect(() => flag.parse('15', undefined)).toThrow('exceeds maximum 10');
	});

	it('should pass parse within range', () => {
		const flag = Flags.number({ min: 1, max: 100 });
		expect(flag.parse('50', undefined)).toBe(50);
	});

	it('should infer number with multiple as array', () => {
		const flag = Flags.number({ multiple: true });
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<number[]>();
	});

	it('should remove null from required number flag', () => {
		const flag = Flags.number({ required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<number>();
	});

	it('should remove null from required multiple number flag', () => {
		const flag = Flags.number({ required: true, multiple: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<number[]>();
	});
});
