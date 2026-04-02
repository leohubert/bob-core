import { custom } from '@/src/flags/custom.js';
import { buildStringAsk } from '@/src/shared/ask-helpers.js';
import { parseString } from '@/src/shared/parsers.js';

export const stringFlag = custom<string>({
	parse: (v: any) => parseString(v),
	ask: buildStringAsk,
	type: 'string',
});
