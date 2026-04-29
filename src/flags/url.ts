import { custom } from '@/src/flags/custom.js';
import { buildUrlAsk } from '@/src/shared/ask-helpers.js';
import { parseUrl } from '@/src/shared/parsers.js';

/** URL flag — parses the input with `new URL()` and returns the resulting `URL` object. */
export const urlFlag = custom<URL>({
	parse: (v: any) => parseUrl(v),
	ask: buildUrlAsk,
	type: 'url',
});
