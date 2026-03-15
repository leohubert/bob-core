import { ExitPromptError } from '@inquirer/core';
import { password } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForPassword } from '@/src/ux/askForPassword.js';

vi.mock('@inquirer/prompts', () => ({
	password: vi.fn(),
}));

describe('askForPassword', () => {
	it('should call password with message', async () => {
		vi.mocked(password).mockResolvedValue('secret');

		const result = await askForPassword('Enter password');

		expect(password).toHaveBeenCalledWith({
			message: 'Enter password',
			mask: undefined,
			validate: undefined,
		});
		expect(result).toBe('secret');
	});

	it('should pass mask option', async () => {
		vi.mocked(password).mockResolvedValue('secret');

		await askForPassword('Enter', { mask: '*' });

		expect(password).toHaveBeenCalledWith(
			expect.objectContaining({ mask: '*' }),
		);
	});

	it('should return null on cancel', async () => {
		vi.mocked(password).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForPassword('Enter');

		expect(result).toBeNull();
	});
});
