import { custom } from '@/src/flags/custom.js';
import { buildFileAsk } from '@/src/shared/ask-helpers.js';
import { parseFile } from '@/src/shared/parsers.js';

export const fileFlag = custom<string, { exists?: boolean }>({
	parse: (v: any, opts): string => parseFile(v, { exists: opts.definition.exists }),
	ask: buildFileAsk,
	type: 'file',
});
