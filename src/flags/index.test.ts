import { describe, expect, it } from 'vitest';

import { Args } from '@/src/args/index.js';
import { Flags } from '@/src/flags/index.js';

describe('Flags builders', () => {
	it('should have option builder', () => {
		const flag = Flags.option({ options: ['a', 'b'] as const });
		expect(flag).toMatchObject({ type: 'option', options: ['a', 'b'] });
	});

	it('should have enum as deprecated alias for option', () => {
		expect(Flags.enum).toBe(Flags.option);
	});
});

describe('Args builders', () => {
	it('should be a separate namespace from Flags', () => {
		expect(Args).not.toBe(Flags);
	});

	it('should not have boolean builder', () => {
		expect('boolean' in Args).toBe(false);
	});

	it('should work for string args', () => {
		const arg = Args.string({ required: true });
		expect(arg).toMatchObject({ type: 'string', required: true });
	});

	it('should work for file args', () => {
		const arg = Args.file({ exists: true, required: true });
		expect(arg).toMatchObject({ type: 'file', exists: true, required: true });
	});

	it('should work for option args', () => {
		const arg = Args.option({ options: ['json', 'csv'] as const });
		expect(arg).toMatchObject({ type: 'option', options: ['json', 'csv'] });
	});

	it('should have enum as deprecated alias for option', () => {
		expect(Args.enum).toBe(Args.option);
	});
});
