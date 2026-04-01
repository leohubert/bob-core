import { describe, expect, expectTypeOf, it } from 'vitest';

import { newFlagOpts } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition, FlagReturnType, FlagType, ParameterOpts } from '@/src/lib/types.js';

describe('Flags.option()', () => {
	let flagOpts: ParameterOpts;

	it('should create an option flag definition', () => {
		const flag = Flags.option({ options: ['debug', 'info', 'warn'] as const });
		expect(flag).toMatchObject({ type: 'option', options: ['debug', 'info', 'warn'] });
		expect(typeof flag.parse).toBe('function');
	});

	it('should accept multiple option', () => {
		const flag = Flags.option({ options: ['a', 'b'] as const, multiple: true });
		expect(flag).toMatchObject({ type: 'option', options: ['a', 'b'], multiple: true });
	});

	it('should have correct type', () => {
		const flag = Flags.option({ options: ['a', 'b'] as const });
		expectTypeOf(flag).toMatchTypeOf<FlagDefinition & { type: 'option' }>();
	});

	it('should infer option values type', () => {
		const _flag = Flags.option({ options: ['debug', 'info', 'warn'] as const });
		type Result = FlagType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<'debug' | 'info' | 'warn'>();
	});

	it('should validate membership in parse', () => {
		const flag = Flags.option({ options: ['a', 'b'] as const });
		flagOpts = newFlagOpts(flag);
		expect(flag.parse('a', flagOpts)).toBe('a');
		expect(() => flag.parse('c', flagOpts)).toThrow('must be one of');
	});

	it('should infer option with multiple as array', () => {
		const _flag = Flags.option({ options: ['a', 'b'] as const, multiple: true });
		type Result = FlagType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<('a' | 'b')[]>();
	});

	it('should remove null from required option flag', () => {
		const _flag = Flags.option({ options: ['a', 'b'] as const, required: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<'a' | 'b'>();
	});

	it('should remove null from defaulted option flag', () => {
		const _flag = Flags.option({ options: ['a', 'b'] as const, default: 'a' });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<'a' | 'b'>();
	});

	it('should remove null from multiple option flag', () => {
		const _flag = Flags.option({ options: ['a', 'b'] as const, multiple: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<('a' | 'b')[]>();
	});
});
