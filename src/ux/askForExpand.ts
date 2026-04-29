import { expand } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type ExpandKey =
	| 'a'
	| 'b'
	| 'c'
	| 'd'
	| 'e'
	| 'f'
	| 'g'
	| 'i'
	| 'j'
	| 'k'
	| 'l'
	| 'm'
	| 'n'
	| 'o'
	| 'p'
	| 'q'
	| 'r'
	| 's'
	| 't'
	| 'u'
	| 'v'
	| 'w'
	| 'x'
	| 'y'
	| 'z'
	| '0'
	| '1'
	| '2'
	| '3'
	| '4'
	| '5'
	| '6'
	| '7'
	| '8'
	| '9';

export type AskForExpandOptions = {
	default?: ExpandKey | 'h';
};

export async function askForExpand<V = string>(
	message: string,
	choices: Array<{ key: ExpandKey; name: string; value: V }>,
	opts?: AskForExpandOptions,
): Promise<V | null> {
	return withCancelHandling(
		() =>
			expand<V>({
				message,
				choices,
				default: opts?.default,
			}),
		null,
	);
}
