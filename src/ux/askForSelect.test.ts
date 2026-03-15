import { ExitPromptError } from '@inquirer/core';
import { select } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForSelect } from '@/src/ux/askForSelect.js';

vi.mock('@inquirer/prompts', () => ({
	select: vi.fn(),
}));

describe('askForSelect', () => {
	it('should normalize string choices', async () => {
		vi.mocked(select).mockResolvedValue('Option 1');

		const result = await askForSelect('Choose', ['Option 1', 'Option 2']);

		expect(select).toHaveBeenCalledWith({
			message: 'Choose',
			choices: [
				{ name: 'Option 1', value: 'Option 1' },
				{ name: 'Option 2', value: 'Option 2' },
			],
			default: undefined,
			pageSize: undefined,
			loop: undefined,
		});
		expect(result).toBe('Option 1');
	});

	it('should pass SelectOption objects through', async () => {
		vi.mocked(select).mockResolvedValue('val1');

		await askForSelect('Choose', [{ name: 'First', value: 'val1' }]);

		expect(select).toHaveBeenCalledWith(
			expect.objectContaining({
				choices: [{ name: 'First', value: 'val1' }],
			}),
		);
	});

	it('should throw on empty choices', async () => {
		await expect(askForSelect('Choose', [])).rejects.toThrow('No options provided');
	});

	it('should return null on cancel', async () => {
		vi.mocked(select).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForSelect('Choose', ['Option 1']);

		expect(result).toBeNull();
	});
});
