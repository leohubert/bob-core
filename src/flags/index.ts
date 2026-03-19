import { booleanFlag } from '@/src/flags/boolean.js';
import { customFlag } from '@/src/flags/custom.js';
import { directoryFlag } from '@/src/flags/directory.js';
import { fileFlag } from '@/src/flags/file.js';
import { numberFlag } from '@/src/flags/number.js';
import { optionFlag } from '@/src/flags/option.js';
import { stringFlag } from '@/src/flags/string.js';
import { urlFlag } from '@/src/flags/url.js';

export const Flags = {
	string: stringFlag,
	number: numberFlag,
	boolean: booleanFlag,
	option: optionFlag,
	file: fileFlag,
	directory: directoryFlag,
	url: urlFlag,
	custom: customFlag,
	/** @deprecated Use Flags.option() */
	enum: optionFlag,
};

export { Args } from '@/src/args/index.js';
