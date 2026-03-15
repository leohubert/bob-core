import { ExitPromptError } from '@inquirer/core';
import { confirm } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForToggle } from '@/src/ux/askForToggle.js';

vi.mock('@inquirer/prompts', () => ({
	confirm: vi.fn(),
}));

describe('askForToggle', () => {
	it('should call confirm with transformer using default labels', async () => {
		vi.mocked(confirm).mockResolvedValue(true);

		const result = await askForToggle('Enable?');

		expect(confirm).toHaveBeenCalledWith({
			message: 'Enable?',
			default: false,
			transformer: expect.any(Function),
		});
		expect(result).toBe(true);
	});

	it('should use custom active/inactive labels in transformer', async () => {
		vi.mocked(confirm).mockResolvedValue(true);

		await askForToggle('Enable?', { active: 'On', inactive: 'Off' });

		const call = vi.mocked(confirm).mock.lastCall![0];
		expect(call.transformer!(true)).toBe('On');
		expect(call.transformer!(false)).toBe('Off');
	});

	it('should return false on cancel', async () => {
		vi.mocked(confirm).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForToggle('Enable?');

		expect(result).toBe(false);
	});
});
