import { confirm } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForConfirmationOptions = {
	default?: boolean;
	transformer?: (value: boolean) => string;
};

export async function askForConfirmation(message = 'Do you want to continue?', opts?: AskForConfirmationOptions): Promise<boolean> {
	return withCancelHandling(
		() =>
			confirm({
				message,
				default: opts?.default ?? false,
				transformer: opts?.transformer,
			}),
		false,
	);
}
