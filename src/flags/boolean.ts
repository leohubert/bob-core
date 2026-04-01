import { custom } from '@/src/flags/custom.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { ParameterOpts } from '@/src/lib/types.js';
import { parseBoolean } from '@/src/shared/parsers.js';

export const booleanFlag = custom({
	default: false,
	parse: (v: any) => parseBoolean(v),
	ask: async (opts: ParameterOpts) => {
		const promptText = formatPromptMessage(opts.name, opts.definition);
		return await opts.ux.askForToggle(promptText);
	},
	type: 'boolean',
});
