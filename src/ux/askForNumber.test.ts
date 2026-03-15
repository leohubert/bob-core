import { ExitPromptError } from '@inquirer/core';
import { number as numberPrompt } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForNumber } from '@/src/ux/askForNumber.js';

vi.mock('@inquirer/prompts', () => ({
	number: vi.fn(),
}));

describe('askForNumber', () => {
	it('should call number with message', async () => {
		vi.mocked(numberPrompt).mockResolvedValue(42);

		const result = await askForNumber('Enter number');

		expect(numberPrompt).toHaveBeenCalledWith({
			message: 'Enter number',
			default: undefined,
			required: undefined,
			min: undefined,
			max: undefined,
			step: undefined,
			validate: undefined,
		});
		expect(result).toBe(42);
	});

	it('should pass min/max/step options', async () => {
		vi.mocked(numberPrompt).mockResolvedValue(5);

		await askForNumber('Enter', { min: 0, max: 10, step: 1 });

		expect(numberPrompt).toHaveBeenCalledWith(
			expect.objectContaining({ min: 0, max: 10, step: 1 }),
		);
	});

	it('should return null when result is undefined', async () => {
		vi.mocked(numberPrompt).mockResolvedValue(undefined as any);

		const result = await askForNumber('Enter');

		expect(result).toBeNull();
	});

	it('should return null on cancel', async () => {
		vi.mocked(numberPrompt).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForNumber('Enter');

		expect(result).toBeNull();
	});
});
