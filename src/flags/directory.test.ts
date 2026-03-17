import { describe, expect, expectTypeOf, it } from 'vitest';

import { Flags } from '@/src/flags/index.js';
import type { DirectoryFlagDef, FlagType } from '@/src/lib/types.js';

describe('Flags.directory()', () => {
	it('should create a directory flag definition', () => {
		const flag = Flags.directory();
		expect(flag).toMatchObject({ type: 'directory' });
		expect(typeof flag.parse).toBe('function');
	});

	it('should accept exists option', () => {
		const flag = Flags.directory({ exists: true });
		expect(flag).toMatchObject({ type: 'directory', exists: true });
	});

	it('should have correct type', () => {
		const flag = Flags.directory();
		expectTypeOf(flag).toMatchTypeOf<DirectoryFlagDef>();
	});

	it('should infer directory as string', () => {
		const _flag = Flags.directory();
		type Result = FlagType<typeof _flag>;
		expectTypeOf<Result>().toEqualTypeOf<string>();
	});

	it('should reject non-existent directory in parse', () => {
		const flag = Flags.directory({ exists: true });
		expect(() => flag.parse('/nonexistent/dir', undefined)).toThrow('directory does not exist');
	});
});
