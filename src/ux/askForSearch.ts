import { search } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';
import type { SelectOption } from '@/src/ux/types.js';

export type SearchSource<V> = (term: string | undefined, opt: { signal: AbortSignal }) => Promise<SelectOption<V>[]> | SelectOption<V>[];

export type AskForSearchOptions<V> = {
	pageSize?: number;
	validate?: (value: V) => boolean | string | Promise<string | boolean>;
};

export async function askForSearch<V = string>(message: string, source: SearchSource<V>, opts?: AskForSearchOptions<V>): Promise<V | null> {
	return withCancelHandling(
		() =>
			search<V>({
				message,
				source,
				pageSize: opts?.pageSize,
				validate: opts?.validate,
			}),
		null,
	);
}
