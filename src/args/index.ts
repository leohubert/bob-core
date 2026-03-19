import { customArg } from '@/src/args/custom.js';
import { directoryArg } from '@/src/args/directory.js';
import { fileArg } from '@/src/args/file.js';
import { numberArg } from '@/src/args/number.js';
import { optionArg } from '@/src/args/option.js';
import { stringArg } from '@/src/args/string.js';
import { urlArg } from '@/src/args/url.js';

export const Args = {
	string: stringArg,
	number: numberArg,
	option: optionArg,
	file: fileArg,
	directory: directoryArg,
	url: urlArg,
	custom: customArg,
	/** @deprecated Use Args.option() */
	enum: optionArg,
};
