import { ExitPromptError } from '@inquirer/core';
import { editor } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';

import { askForEditor } from '@/src/ux/askForEditor.js';

vi.mock('@inquirer/prompts', () => ({
	editor: vi.fn(),
}));

describe('askForEditor', () => {
	it('should call editor with message', async () => {
		vi.mocked(editor).mockResolvedValue('text content');

		const result = await askForEditor('Edit content');

		expect(editor).toHaveBeenCalledWith({
			message: 'Edit content',
			default: undefined,
			postfix: undefined,
			waitForUserInput: undefined,
			validate: undefined,
		});
		expect(result).toBe('text content');
	});

	it('should pass options', async () => {
		vi.mocked(editor).mockResolvedValue('content');

		await askForEditor('Edit', { default: 'initial', postfix: '.md' });

		expect(editor).toHaveBeenCalledWith(expect.objectContaining({ default: 'initial', postfix: '.md' }));
	});

	it('should return null on cancel', async () => {
		vi.mocked(editor).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForEditor('Edit');

		expect(result).toBeNull();
	});
});
