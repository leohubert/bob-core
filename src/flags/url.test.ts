import { describe, expect, expectTypeOf, it } from 'vitest';

import { flagOptsMock } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition, FlagOpts, FlagReturnType, FlagType } from '@/src/lib/types.js';

describe('Flags.url()', () => {
	let flagOpts: FlagOpts;

	it('should create a url flag definition', () => {
		const flag = Flags.url();
		expect(flag).toMatchObject({ type: 'url' });
		expect(typeof flag.parse).toBe('function');
	});

	it('should have correct type', () => {
		const flag = Flags.url();
		expectTypeOf(flag).toMatchTypeOf<FlagDefinition>();
	});

	it('should infer url as URL', () => {
		const _flag = Flags.url();
		type Result = FlagType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<URL>();
	});

	it('should parse valid URLs', () => {
		const flag = Flags.url();
		flagOpts = flagOptsMock(flag);
		const result = flag.parse('https://example.com', flagOpts);
		expect(result).toBeInstanceOf(URL);
		expect(result.href).toBe('https://example.com/');
	});

	it('should throw on invalid URLs', () => {
		const flag = Flags.url();
		flagOpts = flagOptsMock(flag);
		expect(() => flag.parse('not-a-url', flagOpts)).toThrow();
	});

	it('should remove null from required url flag', () => {
		const _flag = Flags.url({ required: true });
		type Result = FlagReturnType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<URL>();
	});
});
