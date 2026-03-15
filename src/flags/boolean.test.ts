import { describe, expect, expectTypeOf, it } from 'vitest';

import { Flags } from '@/src/flags/index.js';
import type { BooleanFlagDef } from '@/src/lib/types.js';

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

	it('should default to false', () => {
		const flag = Flags.boolean();
		expect(flag.default).toBe(false);
	});

	it('should parse boolean values', () => {
		const flag = Flags.boolean();
		expect(flag.parse(true, undefined)).toBe(true);
		expect(flag.parse(false, undefined)).toBe(false);
	});

	it('should parse string values', () => {
		const flag = Flags.boolean();
		expect(flag.parse('true', undefined)).toBe(true);
		expect(flag.parse('false', undefined)).toBe(false);
		expect(flag.parse('1', undefined)).toBe(true);
		expect(flag.parse('0', undefined)).toBe(false);
	});
});
