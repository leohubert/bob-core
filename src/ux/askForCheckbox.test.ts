import { ExitPromptError } from '@inquirer/core';
import { checkbox } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForCheckbox } from '@/src/ux/askForCheckbox.js';

vi.mock('@inquirer/prompts', () => ({
	checkbox: vi.fn(),
}));

describe('askForCheckbox', () => {
	it('should normalize string choices', async () => {
		vi.mocked(checkbox).mockResolvedValue(['a', 'b']);

		const result = await askForCheckbox('Select', ['a', 'b', 'c']);

		expect(checkbox).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Select',
				choices: [
					{ name: 'a', value: 'a', disabled: undefined, checked: undefined, description: undefined },
					{ name: 'b', value: 'b', disabled: undefined, checked: undefined, description: undefined },
					{ name: 'c', value: 'c', disabled: undefined, checked: undefined, description: undefined },
				],
			}),
		);
		expect(result).toEqual(['a', 'b']);
	});

	it('should throw on empty choices', async () => {
		await expect(askForCheckbox('Select', [])).rejects.toThrow('No options provided');
	});

	it('should return null on cancel', async () => {
		vi.mocked(checkbox).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForCheckbox('Select', ['a']);

		expect(result).toBeNull();
	});
});
