import { custom } from '@/src/flags/custom.js';
import { buildDirectoryAsk } from '@/src/shared/ask-helpers.js';
import { parseDirectory } from '@/src/shared/parsers.js';

/** Filesystem directory flag. Pass `exists: true` to require the directory to exist at parse time. */
export const directoryFlag = custom<string, { exists?: boolean }>({
	parse: (v: any, opts): string => parseDirectory(v, { exists: opts.definition.exists }),
	ask: buildDirectoryAsk,
	type: 'directory',
});
