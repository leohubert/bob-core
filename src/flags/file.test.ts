import { describe, expect, expectTypeOf, it } from 'vitest';

import { Flags } from '@/src/flags/index.js';
import type { FileFlagDef, FlagReturnType, FlagType } from '@/src/lib/types.js';

describe('Flags.file()', () => {
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
		expectTypeOf(flag).toMatchTypeOf<FileFlagDef>();
	});

	it('should infer file as string', () => {
		const flag = Flags.file();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should remove null from required file flag', () => {
		const flag = Flags.file({ required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should reject non-existent file in parse', () => {
		const flag = Flags.file({ exists: true });
		expect(() => flag.parse('/nonexistent/path.txt', undefined)).toThrow('file does not exist');
	});
});
