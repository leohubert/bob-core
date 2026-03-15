import { select } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';
import type { SelectOption } from '@/src/ux/types.js';

export type AskForSelectOptions<V> = {
	default?: V;
	pageSize?: number;
	loop?: boolean;
};

export async function askForSelect<V = string>(message: string, choices: Array<string | SelectOption<V>>, opts?: AskForSelectOptions<V>): Promise<V | null> {
	if (choices.length === 0) {
		throw new Error('No options provided');
	}

	const normalizedChoices = choices.map(choice => {
		if (typeof choice === 'string') {
			return { name: choice, value: choice as V };
		}
		return choice;
	});

	return withCancelHandling(
		() =>
			select<V>({
				message,
				choices: normalizedChoices,
				default: opts?.default,
				pageSize: opts?.pageSize,
				loop: opts?.loop,
			}),
		null,
	);
}
