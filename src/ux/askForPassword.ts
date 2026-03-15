import { password } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForPasswordOptions = {
	mask?: boolean | string;
	validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export async function askForPassword(message: string, opts?: AskForPasswordOptions): Promise<string | null> {
	return withCancelHandling(
		() =>
			password({
				message,
				mask: opts?.mask,
				validate: opts?.validate,
			}),
		null,
	);
}
