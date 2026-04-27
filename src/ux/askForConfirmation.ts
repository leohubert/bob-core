import { confirm } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForConfirmationOptions = {
	default?: boolean;
	transformer?: (value: boolean) => string;
};

/**
 * Yes/no confirmation prompt. Returns the user's choice, or `null` if they
 * cancelled (Ctrl+C / SIGINT) — matching the cancellation contract used by
 * every other prompt in the {@link UX} module.
 */
export async function askForConfirmation(message = 'Do you want to continue?', opts?: AskForConfirmationOptions): Promise<boolean | null> {
	return withCancelHandling(
		() =>
			confirm({
				message,
				default: opts?.default ?? false,
				transformer: opts?.transformer,
			}),
		null,
	);
}
