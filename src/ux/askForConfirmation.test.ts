import { ExitPromptError } from '@inquirer/core';
import { confirm } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForConfirmation } from '@/src/ux/askForConfirmation.js';

vi.mock('@inquirer/prompts', () => ({
	confirm: vi.fn(),
}));

describe('askForConfirmation', () => {
	it('should call confirm with default message', async () => {
		vi.mocked(confirm).mockResolvedValue(true);

		const result = await askForConfirmation();

		expect(confirm).toHaveBeenCalledWith({
			message: 'Do you want to continue?',
			default: false,
			transformer: undefined,
		});
		expect(result).toBe(true);
	});

	it('should call confirm with custom message and options', async () => {
		vi.mocked(confirm).mockResolvedValue(false);

		const result = await askForConfirmation('Are you sure?', { default: true });

		expect(confirm).toHaveBeenCalledWith({
			message: 'Are you sure?',
			default: true,
			transformer: undefined,
		});
		expect(result).toBe(false);
	});

	it('should return null on cancel (matches the cancel contract used by the rest of UX)', async () => {
		vi.mocked(confirm).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForConfirmation('Confirm?');

		expect(result).toBeNull();
	});
});
