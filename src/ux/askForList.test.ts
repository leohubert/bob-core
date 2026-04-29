import { ExitPromptError } from '@inquirer/core';
import { input } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForList } from '@/src/ux/askForList.js';

vi.mock('@inquirer/prompts', () => ({
	input: vi.fn(),
}));

describe('askForList', () => {
	it('should split input by comma by default', async () => {
		vi.mocked(input).mockResolvedValue('a, b, c');

		const result = await askForList('Enter items');

		expect(result).toEqual(['a', 'b', 'c']);
	});

	it('should split by custom separator', async () => {
		vi.mocked(input).mockResolvedValue('a|b|c');

		const result = await askForList('Enter items', { separator: '|' });

		expect(result).toEqual(['a', 'b', 'c']);
	});

	it('should filter empty strings', async () => {
		vi.mocked(input).mockResolvedValue('a,,b, ,c');

		const result = await askForList('Enter items');

		expect(result).toEqual(['a', 'b', 'c']);
	});

	it('should return null on cancel', async () => {
		vi.mocked(input).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForList('Enter items');

		expect(result).toBeNull();
	});
});
