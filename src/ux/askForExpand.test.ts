import { ExitPromptError } from '@inquirer/core';
import { expand } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForExpand } from '@/src/ux/askForExpand.js';

vi.mock('@inquirer/prompts', () => ({
	expand: vi.fn(),
}));

describe('askForExpand', () => {
	it('should call expand with choices', async () => {
		vi.mocked(expand).mockResolvedValue('yes');

		const choices = [
			{ key: 'y' as const, name: 'Yes', value: 'yes' },
			{ key: 'n' as const, name: 'No', value: 'no' },
		];
		const result = await askForExpand('Proceed?', choices);

		expect(expand).toHaveBeenCalledWith({
			message: 'Proceed?',
			choices,
			default: undefined,
		});
		expect(result).toBe('yes');
	});

	it('should return null on cancel', async () => {
		vi.mocked(expand).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForExpand('Proceed?', [{ key: 'y', name: 'Yes', value: 'yes' }]);

		expect(result).toBeNull();
	});
});
