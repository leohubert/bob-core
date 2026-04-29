import { custom } from '@/src/flags/custom.js';
import { buildFileAsk } from '@/src/shared/ask-helpers.js';
import { parseFile } from '@/src/shared/parsers.js';

/** Filesystem file flag. Pass `exists: true` to require the path to exist at parse time. */
export const fileFlag = custom<string, { exists?: boolean }>({
	parse: (v: any, opts): string => parseFile(v, { exists: opts.definition.exists }),
	ask: buildFileAsk,
	type: 'file',
});
