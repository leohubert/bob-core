import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { ArgInput, ArgOpts, DirectoryArgDef } from '@/src/lib/types.js';
import { parseDirectory } from '@/src/shared/parsers.js';

export function directoryArg<const T extends ArgInput<DirectoryArgDef>>(opts?: T): DirectoryArgDef & T {
	return {
		default: null,
		ask: async (argOpts: ArgOpts) => {
			const promptText = formatPromptMessage(argOpts.name, argOpts.definition);
			return argOpts.ux.askForDirectory(promptText, { basePath: process.cwd() });
		},
		parse: (input: string, _opts: ArgOpts): string => parseDirectory(input, { exists: opts?.exists }),
		...opts,
		type: 'directory',
	} as DirectoryArgDef & T;
}
