import { describe, expect, expectTypeOf, it } from 'vitest';

import { Flags } from '@/src/flags/index.js';
import type { FlagType, UrlFlagDef } from '@/src/lib/types.js';

describe('Flags.url()', () => {
	it('should create a url flag definition', () => {
		const flag = Flags.url();
		expect(flag).toMatchObject({ type: 'url' });
		expect(typeof flag.parse).toBe('function');
	});

	it('should have correct type', () => {
		const flag = Flags.url();
		expectTypeOf(flag).toMatchTypeOf<UrlFlagDef>();
	});

	it('should infer url as URL', () => {
		const flag = Flags.url();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<URL>();
	});

	it('should parse valid URLs', () => {
		const flag = Flags.url();
		const result = flag.parse('https://example.com', undefined);
		expect(result).toBeInstanceOf(URL);
		expect(result.href).toBe('https://example.com/');
	});

	it('should throw on invalid URLs', () => {
		const flag = Flags.url();
		expect(() => flag.parse('not-a-url', undefined)).toThrow();
	});
});
