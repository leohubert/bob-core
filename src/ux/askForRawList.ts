import { rawlist } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForRawListOptions = {
	loop?: boolean;
};

export async function askForRawList<V = string>(
	message: string,
	choices: Array<{ key?: string; name?: string; value: V }>,
	opts?: AskForRawListOptions,
): Promise<V | null> {
	return withCancelHandling(
		() =>
			rawlist<V>({
				message,
				choices,
				loop: opts?.loop,
			}),
		null,
	);
}
