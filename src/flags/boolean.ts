import { custom } from '@/src/flags/custom.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FlagOpts } from '@/src/lib/types.js';
import { parseBoolean } from '@/src/shared/parsers.js';

/** Boolean flag (`--debug` / `--no-debug`). Defaults to `false` when omitted. */
export const booleanFlag = custom<boolean>({
	default: false,
	parse: (v: any) => parseBoolean(v),
	ask: async (opts: FlagOpts) => {
		const promptText = formatPromptMessage(opts.name, opts.definition);
		return await opts.ux.askForToggle(promptText);
	},
	type: 'boolean',
});
