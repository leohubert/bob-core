import { ExitPromptError } from '@inquirer/core';
import { input } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForInput } from '@/src/ux/askForInput.js';

vi.mock('@inquirer/prompts', () => ({
	input: vi.fn(),
}));

describe('askForInput', () => {
	it('should call input with message', async () => {
		vi.mocked(input).mockResolvedValue('hello');

		const result = await askForInput('Enter name');

		expect(input).toHaveBeenCalledWith({
			message: 'Enter name',
			default: undefined,
			required: undefined,
			validate: undefined,
			transformer: undefined,
		});
		expect(result).toBe('hello');
	});

	it('should pass options through', async () => {
		const validate = vi.fn().mockReturnValue(true);
		vi.mocked(input).mockResolvedValue('test');

		await askForInput('Enter', { default: 'def', required: true, validate });

		expect(input).toHaveBeenCalledWith(
			expect.objectContaining({
				default: 'def',
				required: true,
				validate,
			}),
		);
	});

	it('should return null on cancel', async () => {
		vi.mocked(input).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForInput('Enter');

		expect(result).toBeNull();
	});
});
