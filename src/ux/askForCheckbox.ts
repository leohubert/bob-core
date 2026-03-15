import { checkbox } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';
import type { SelectOption } from '@/src/ux/types.js';

export type AskForCheckboxOptions<V> = {
	required?: boolean;
	pageSize?: number;
	loop?: boolean;
	validate?: (
		values: ReadonlyArray<{ value: V; name: string; checkedName: string; description?: string; short: string; disabled: boolean | string; checked: boolean }>,
	) => boolean | string | Promise<string | boolean>;
	shortcuts?: { all?: string | null; invert?: string | null };
};

export async function askForCheckbox<V = string>(
	message: string,
	choices: Array<string | SelectOption<V>>,
	opts?: AskForCheckboxOptions<V>,
): Promise<V[] | null> {
	if (choices.length === 0) {
		throw new Error('No options provided');
	}

	const normalizedChoices = choices.map(choice => {
		if (typeof choice === 'string') {
			return { name: choice, value: choice as V };
		}
		return { name: choice.name, value: choice.value, disabled: choice.disabled, checked: choice.checked, description: choice.description };
	});

	return withCancelHandling(
		() =>
			checkbox<V>({
				message,
				choices: normalizedChoices,
				required: opts?.required,
				pageSize: opts?.pageSize,
				loop: opts?.loop,
				validate: opts?.validate,
				shortcuts: opts?.shortcuts,
			}),
		null,
	);
}
