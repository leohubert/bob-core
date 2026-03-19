import { describe, expect, expectTypeOf, it } from 'vitest';

import { formatPromptMessage } from '@/src/flags/helpers.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition, FlagType } from '@/src/lib/types.js';

describe('helpers', () => {
	describe('formatPromptMessage', () => {
		it('should include the flag name', () => {
			const def = Flags.string({ description: 'A name' }) as FlagDefinition;
			const msg = formatPromptMessage('name', def);
			expect(msg).toContain('name');
		});

		it('should include the description', () => {
			const def = Flags.string({ description: 'User name' }) as FlagDefinition;
			const msg = formatPromptMessage('name', def);
			expect(msg).toContain('User name');
		});

		it('should show [] for multiple', () => {
			const def = Flags.string({ multiple: true }) as FlagDefinition;
			const msg = formatPromptMessage('tags', def);
			expect(msg).toContain('string[]');
		});
	});

	describe('nested array prevention', () => {
		it('should not double-wrap arrays with custom multiple flag', () => {
			const _flag = Flags.custom<string[]>()({ multiple: true });
			type Result = FlagType<typeof _flag>;
			expectTypeOf<Result>().toEqualTypeOf<string[]>();
		});
	});
});
