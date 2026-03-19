import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { BooleanFlagDef, FlagInput, FlagOpts } from '@/src/lib/types.js';
import { parseBoolean } from '@/src/shared/parsers.js';

export function booleanFlag<const T extends FlagInput<BooleanFlagDef>>(opts?: T): BooleanFlagDef & T {
	return {
		default: false,
		ask: async (flagOpts: FlagOpts) => {
			const promptText = formatPromptMessage(flagOpts.name, flagOpts.definition);
			return await flagOpts.ux.askForToggle(promptText);
		},
		parse: (value: string | boolean, _opts: FlagOpts): boolean => parseBoolean(value),
		...opts,
		type: 'boolean',
	} as BooleanFlagDef & T;
}
