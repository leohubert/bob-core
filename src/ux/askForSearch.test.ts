import { ExitPromptError } from '@inquirer/core';
import { search } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForSearch } from '@/src/ux/askForSearch.js';

vi.mock('@inquirer/prompts', () => ({
	search: vi.fn(),
}));

describe('askForSearch', () => {
	it('should call search with message and source', async () => {
		const source = vi.fn().mockResolvedValue([{ name: 'Result', value: 'val' }]);
		vi.mocked(search).mockResolvedValue('val');

		const result = await askForSearch('Search', source);

		expect(search).toHaveBeenCalledWith({
			message: 'Search',
			source,
			pageSize: undefined,
			validate: undefined,
		});
		expect(result).toBe('val');
	});

	it('should return null on cancel', async () => {
		const source = vi.fn().mockResolvedValue([]);
		vi.mocked(search).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForSearch('Search', source);

		expect(result).toBeNull();
	});
});
