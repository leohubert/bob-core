import { describe, expect, expectTypeOf, it } from 'vitest';

import { newFlagOpts } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition, FlagReturnType, FlagType, ParameterOpts } from '@/src/lib/types.js';

describe('Flags.number()', () => {
	let flagOpts: ParameterOpts;

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
		expectTypeOf(flag).toMatchTypeOf<FlagDefinition>();
	});

	it('should parse numeric strings', () => {
		const flag = Flags.number();
		flagOpts = newFlagOpts(flag);
		expect(flag.parse('42', flagOpts)).toBe(42);
	});

	it('should throw on non-numeric input', () => {
		const flag = Flags.number();
		flagOpts = newFlagOpts(flag);
		expect(() => flag.parse('abc', flagOpts)).toThrow('must be a valid number');
	});

	it('should reject below min in parse', () => {
		const flag = Flags.number({ min: 5 });
		flagOpts = newFlagOpts(flag);
		expect(() => flag.parse('3', flagOpts)).toThrow('is below minimum 5');
	});

	it('should reject above max in parse', () => {
		const flag = Flags.number({ max: 10 });
		flagOpts = newFlagOpts(flag);
		expect(() => flag.parse('15', flagOpts)).toThrow('exceeds maximum 10');
	});

	it('should pass parse within range', () => {
		const flag = Flags.number({ min: 1, max: 100 });
		flagOpts = newFlagOpts(flag);
		expect(flag.parse('50', flagOpts)).toBe(50);
	});

	it('should infer number with multiple as array', () => {
		const _flag = Flags.number({ multiple: true });
		type Result = FlagType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<number[]>();
	});

	it('should remove null from required number flag', () => {
		const _flag = Flags.number({ required: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<number>();
	});

	it('should remove null from required multiple number flag', () => {
		const _flag = Flags.number({ required: true, multiple: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<number[]>();
	});

	it('should remove null from defaulted number flag', () => {
		const _flag = Flags.number({ default: 3000 });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<number>();
	});

	it('should remove null from multiple number flag', () => {
		const _flag = Flags.number({ multiple: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<number[]>();
	});
});
