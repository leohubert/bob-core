import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FileFlagDef, FlagInput, FlagOpts } from '@/src/lib/types.js';
import { parseFile } from '@/src/shared/parsers.js';

export function fileFlag<const T extends FlagInput<FileFlagDef>>(opts?: T): FileFlagDef & T {
	return {
		default: null,
		ask: async (flagOpts: FlagOpts) => {
			const promptText = formatPromptMessage(flagOpts.name, flagOpts.definition);
			return flagOpts.ux.askForFile(promptText, { basePath: process.cwd() });
		},
		parse: (input: string, _opts: FlagOpts): string => parseFile(input, { exists: opts?.exists }),
		...opts,
		type: 'file',
	} as FileFlagDef & T;
}
