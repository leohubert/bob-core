import fs from 'node:fs';

import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { DirectoryFlagDef, FlagAskContext, FlagInput } from '@/src/lib/types.js';

export function directoryFlag<const T extends FlagInput<DirectoryFlagDef>>(opts?: T): DirectoryFlagDef & T {
	return {
		default: null,
		ask: async (ctx: FlagAskContext) => {
			const promptText = formatPromptMessage(ctx.name, ctx.definition);
			return ctx.ux.askForDirectory(promptText, { basePath: process.cwd() });
		},
		parse: (input: any): string => {
			const path = String(input);
			if (opts?.exists && !(fs.existsSync(path) && fs.lstatSync(path).isDirectory())) {
				throw new ValidationError('directory does not exist');
			}
			return path;
		},
		...opts,
		type: 'directory',
	} as DirectoryFlagDef & T;
}
