import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { DirectoryFlagDef, FlagInput, FlagOpts } from '@/src/lib/types.js';
import { parseDirectory } from '@/src/shared/parsers.js';

export function directoryFlag<const T extends FlagInput<DirectoryFlagDef>>(opts?: T): DirectoryFlagDef & T {
	return {
		default: null,
		ask: async (flagOpts: FlagOpts) => {
			const promptText = formatPromptMessage(flagOpts.name, flagOpts.definition);
			return flagOpts.ux.askForDirectory(promptText, { basePath: process.cwd() });
		},
		parse: (input: string, _opts: FlagOpts): string => parseDirectory(input, { exists: opts?.exists }),
		...opts,
		type: 'directory',
	} as DirectoryFlagDef & T;
}
