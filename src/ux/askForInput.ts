import { input } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForInputOptions = {
	default?: string;
	required?: boolean;
	validate?: (value: string) => boolean | string | Promise<string | boolean>;
	transformer?: (value: string, meta: { isFinal: boolean }) => string;
};

export async function askForInput(message: string, opts?: AskForInputOptions): Promise<string | null> {
	return withCancelHandling(
		() =>
			input({
				message,
				default: opts?.default,
				required: opts?.required,
				validate: opts?.validate,
				transformer: opts?.transformer,
			}),
		null,
	);
}
