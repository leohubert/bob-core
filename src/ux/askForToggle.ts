import { confirm } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForToggleOptions = {
	default?: boolean;
	active?: string;
	inactive?: string;
};

/**
 * Two-state toggle prompt with custom labels. Returns the chosen state, or
 * `null` if cancelled (Ctrl+C / SIGINT).
 */
export async function askForToggle(message: string, opts?: AskForToggleOptions): Promise<boolean | null> {
	const active = opts?.active ?? 'Yes';
	const inactive = opts?.inactive ?? 'No';

	return withCancelHandling(
		() =>
			confirm({
				message,
				default: opts?.default ?? false,
				transformer: (value: boolean) => (value ? active : inactive),
			}),
		null,
	);
}
