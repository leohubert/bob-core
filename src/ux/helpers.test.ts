import { ExitPromptError } from '@inquirer/core';
import { describe, expect, it } from 'vitest';

import { withCancelHandling } from '@/src/ux/helpers.js';

describe('withCancelHandling', () => {
	it('should return the result of the function', async () => {
		const result = await withCancelHandling(() => Promise.resolve('hello'), 'fallback');
		expect(result).toBe('hello');
	});

	it('should return fallback on ExitPromptError', async () => {
		const result = await withCancelHandling(() => Promise.reject(new ExitPromptError('cancelled')), 'fallback');
		expect(result).toBe('fallback');
	});

	it('should return fallback on ExitPromptError from different package instance', async () => {
		const foreignError = new Error('User force closed the prompt with SIGINT');
		foreignError.name = 'ExitPromptError';
		const result = await withCancelHandling(() => Promise.reject(foreignError), 'fallback');
		expect(result).toBe('fallback');
	});

	it('should re-throw non-ExitPromptError errors', async () => {
		await expect(withCancelHandling(() => Promise.reject(new Error('other')), 'fallback')).rejects.toThrow('other');
	});
});
