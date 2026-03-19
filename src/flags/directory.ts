import fs from 'node:fs';

import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { DirectoryFlagDef, FlagInput, FlagOpts, HasDefault } from '@/src/lib/types.js';

type DirectoryFlagReturn<T> = T extends { default: NonNullable<DirectoryFlagDef['default']> } ? DirectoryFlagDef & T & HasDefault : DirectoryFlagDef & T;

export function directoryFlag<const T extends FlagInput<DirectoryFlagDef>>(opts?: T): DirectoryFlagReturn<T> {
	return {
		default: null,
		ask: async (flagOpts: FlagOpts) => {
			const promptText = formatPromptMessage(flagOpts.name, flagOpts.definition);
			return flagOpts.ux.askForDirectory(promptText, { basePath: process.cwd() });
		},
		parse: (input: string, _opts: FlagOpts): string => {
			const path = String(input);
			if (opts?.exists && !(fs.existsSync(path) && fs.lstatSync(path).isDirectory())) {
				throw new ValidationError('directory does not exist');
			}
			return path;
		},
		...opts,
		type: 'directory',
	} as DirectoryFlagReturn<T>;
}
