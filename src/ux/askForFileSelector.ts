import { fileSelector } from 'inquirer-file-selector';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForFileSelectorOptions = {
	type?: 'file' | 'directory' | 'file+directory';
	basePath?: string;
	filter?: (fileInfo: { isDirectory: boolean; name: string; path: string }) => boolean;
	pageSize?: number;
	loop?: boolean;
};

export async function askForFileSelector(message: string, opts?: AskForFileSelectorOptions): Promise<string | null> {
	return withCancelHandling(
		async () => {
			const result = await fileSelector({
				message,
				basePath: opts?.basePath,
				type: opts?.type === 'file+directory' ? undefined : opts?.type,
				filter: opts?.filter,
				allowCancel: true,
				pageSize: opts?.pageSize,
				loop: opts?.loop,
			});

			if (result === null) return null;

			return result.path;
		},
		null,
	);
}
