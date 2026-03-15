import { ExitPromptError } from '@inquirer/core';
import { fileSelector } from 'inquirer-file-selector';
import { describe, expect, it, vi } from 'vitest';

import { askForFileSelector } from '@/src/ux/askForFileSelector.js';

vi.mock('inquirer-file-selector', () => ({
	fileSelector: vi.fn(),
}));

describe('askForFileSelector', () => {
	it('should call fileSelector with message and return path', async () => {
		vi.mocked(fileSelector).mockResolvedValue({ path: '/home/user/file.txt' } as any);

		const result = await askForFileSelector('Select a file');

		expect(fileSelector).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Select a file',
				allowCancel: true,
			}),
		);
		expect(result).toBe('/home/user/file.txt');
	});

	it('should forward options', async () => {
		vi.mocked(fileSelector).mockResolvedValue({ path: '/tmp' } as any);

		await askForFileSelector('Pick', {
			type: 'directory',
			basePath: '/home',
			pageSize: 20,
			loop: true,
		});

		expect(fileSelector).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Pick',
				type: 'directory',
				basePath: '/home',
				pageSize: 20,
				loop: true,
				allowCancel: true,
			}),
		);
	});

	it('should pass type as undefined for file+directory', async () => {
		vi.mocked(fileSelector).mockResolvedValue({ path: '/tmp/file' } as any);

		await askForFileSelector('Pick', { type: 'file+directory' });

		expect(fileSelector).toHaveBeenCalledWith(
			expect.objectContaining({
				type: undefined,
			}),
		);
	});

	it('should return null on cancel', async () => {
		vi.mocked(fileSelector).mockRejectedValue(new ExitPromptError('cancelled'));

		const result = await askForFileSelector('Select');

		expect(result).toBeNull();
	});

	it('should return null when fileSelector returns null', async () => {
		vi.mocked(fileSelector).mockResolvedValue(null as any);

		const result = await askForFileSelector('Select');

		expect(result).toBeNull();
	});
});
