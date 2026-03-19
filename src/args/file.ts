import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { ArgInput, ArgOpts, FileArgDef } from '@/src/lib/types.js';
import { parseFile } from '@/src/shared/parsers.js';

export function fileArg<const T extends ArgInput<FileArgDef>>(opts?: T): FileArgDef & T {
	return {
		default: null,
		ask: async (argOpts: ArgOpts) => {
			const promptText = formatPromptMessage(argOpts.name, argOpts.definition);
			return argOpts.ux.askForFile(promptText, { basePath: process.cwd() });
		},
		parse: (input: string, _opts: ArgOpts): string => parseFile(input, { exists: opts?.exists }),
		...opts,
		type: 'file',
	} as FileArgDef & T;
}
