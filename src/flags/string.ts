import { custom } from '@/src/flags/custom.js';
import { buildStringAsk } from '@/src/shared/ask-helpers.js';
import { parseString } from '@/src/shared/parsers.js';

/** Text input flag. Pass `secret: true` to mask the prompt as a password. */
export const stringFlag = custom<string>({
	parse: (v: any) => parseString(v),
	ask: buildStringAsk,
	type: 'string',
});
