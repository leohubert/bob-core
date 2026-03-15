import { input } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForListOptions = {
	default?: string;
	separator?: string;
	validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export async function askForList(message: string, opts?: AskForListOptions): Promise<string[] | null> {
	const separator = opts?.separator ?? ',';

	return withCancelHandling(async () => {
		const result = await input({
			message,
			default: opts?.default,
			validate: opts?.validate,
		});
		return result
			.split(separator)
			.map(s => s.trim())
			.filter(s => s.length > 0);
	}, null);
}
