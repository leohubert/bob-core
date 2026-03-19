import fs from 'node:fs';

import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FileFlagDef, FlagInput, FlagOpts, HasDefault } from '@/src/lib/types.js';

type FileFlagReturn<T> = T extends { default: NonNullable<FileFlagDef['default']> } ? FileFlagDef & T & HasDefault : FileFlagDef & T;

export function fileFlag<const T extends FlagInput<FileFlagDef>>(opts?: T): FileFlagReturn<T> {
	return {
		default: null,
		ask: async (flagOpts: FlagOpts) => {
			const promptText = formatPromptMessage(flagOpts.name, flagOpts.definition);
			return flagOpts.ux.askForFile(promptText, { basePath: process.cwd() });
		},
		parse: (input: string, _opts: FlagOpts): string => {
			const path = String(input);
			if (opts?.exists && !fs.existsSync(path)) {
				throw new ValidationError('file does not exist');
			}
			return path;
		},
		...opts,
		type: 'file',
	} as FileFlagReturn<T>;
}
