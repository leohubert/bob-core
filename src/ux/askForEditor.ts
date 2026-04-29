import { editor } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForEditorOptions = {
	default?: string;
	postfix?: string;
	waitForUserInput?: boolean;
	validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export async function askForEditor(message: string, opts?: AskForEditorOptions): Promise<string | null> {
	return withCancelHandling(
		() =>
			editor({
				message,
				default: opts?.default,
				postfix: opts?.postfix,
				waitForUserInput: opts?.waitForUserInput,
				validate: opts?.validate,
			}),
		null,
	);
}
