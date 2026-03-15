import { ExitPromptError } from '@inquirer/core';
import { rawlist } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForRawList } from '@/src/ux/askForRawList.js';

vi.mock('@inquirer/prompts', () => ({
	rawlist: vi.fn(),
}));

describe('askForRawList', () => {
	it('should call rawlist with choices', async () => {
		vi.mocked(rawlist).mockResolvedValue('val1');

		const choices = [
			{ key: '1', name: 'First', value: 'val1' },
			{ key: '2', name: 'Second', value: 'val2' },
		];
		const result = await askForRawList('Choose', choices);

		expect(rawlist).toHaveBeenCalledWith({
			message: 'Choose',
			choices,
			loop: undefined,
		});
		expect(result).toBe('val1');
	});

	it('should return null on cancel', async () => {
		vi.mocked(rawlist).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForRawList('Choose', [{ value: 'a' }]);

		expect(result).toBeNull();
	});
});
