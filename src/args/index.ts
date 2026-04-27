import { custom } from '@/src/flags/custom.js';
import { directoryFlag } from '@/src/flags/directory.js';
import { fileFlag } from '@/src/flags/file.js';
import { numberFlag } from '@/src/flags/number.js';
import { optionFlag } from '@/src/flags/option.js';
import { stringFlag } from '@/src/flags/string.js';
import { urlFlag } from '@/src/flags/url.js';

/**
 * Builders for positional arguments (`static args = { ... }`).
 *
 * Same surface as {@link Flags} minus `boolean` — booleans don't make sense as
 * positional inputs and the `ArgsSchema` type rejects them at compile time.
 */
export const Args = {
	string: stringFlag,
	number: numberFlag,
	option: optionFlag,
	file: fileFlag,
	directory: directoryFlag,
	url: urlFlag,
	custom,
};
