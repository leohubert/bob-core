import { describe, expect, expectTypeOf, it } from 'vitest';

import { Flags } from '@/src/flags/index.js';
import type { EnumFlagDef, FlagReturnType, FlagType } from '@/src/lib/types.js';

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

	it('should validate membership in parse', () => {
		const flag = Flags.enum({ options: ['a', 'b'] as const });
		expect(flag.parse('a', undefined)).toBe('a');
		expect(() => flag.parse('c', undefined)).toThrow('must be one of');
	});

	it('should infer enum with multiple as array', () => {
		const flag = Flags.enum({ options: ['a', 'b'] as const, multiple: true });
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<('a' | 'b')[]>();
	});

	it('should remove null from required enum flag', () => {
		const flag = Flags.enum({ options: ['a', 'b'] as const, required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<'a' | 'b'>();
	});
});
