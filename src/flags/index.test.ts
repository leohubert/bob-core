import { describe, expect, it } from 'vitest';

import { Args, Flags } from '@/src/flags/index.js';

describe('Args builders', () => {
	it('should be the same as Flags', () => {
		expect(Args).toBe(Flags);
	});

	it('should work for args', () => {
		const arg = Args.file({ exists: true, required: true });
		expect(arg).toMatchObject({ type: 'file', exists: true, required: true });
	});

	it('should work for enum args', () => {
		const arg = Args.enum({ options: ['json', 'csv'] as const });
		expect(arg).toMatchObject({ type: 'enum', options: ['json', 'csv'] });
	});
});
