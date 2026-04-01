import { custom } from '@/src/flags/custom.js';
import { buildNumberAsk } from '@/src/shared/ask-helpers.js';
import { parseNumber } from '@/src/shared/parsers.js';

export const numberFlag = custom<number, { min?: number; max?: number }>({
	parse: (v: any, opts): number => parseNumber(v, { min: opts.definition.min, max: opts.definition.max }),
	ask: buildNumberAsk,
	type: 'number',
});
