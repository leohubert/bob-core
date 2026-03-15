import fs from 'node:fs';

import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FileFlagDef, FlagAskContext, FlagInput } from '@/src/lib/types.js';

export function fileFlag<const T extends FlagInput<FileFlagDef>>(opts?: T): FileFlagDef & T {
	return {
		default: null,
		ask: async (ctx: FlagAskContext) => {
			const promptText = formatPromptMessage(ctx.name, ctx.definition);
			return ctx.ux.askForFile(promptText, { basePath: process.cwd() });
		},
		parse: (input: any): string => {
			const path = String(input);
			if (opts?.exists && !fs.existsSync(path)) {
				throw new ValidationError('file does not exist');
			}
			return path;
		},
		...opts,
		type: 'file',
	} as FileFlagDef & T;
}
