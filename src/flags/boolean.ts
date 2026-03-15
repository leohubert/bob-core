import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { BooleanFlagDef, FlagAskContext, FlagInput } from '@/src/lib/types.js';

export function booleanFlag<const T extends FlagInput<BooleanFlagDef>>(opts?: T): BooleanFlagDef & T {
	return {
		default: false,
		ask: async (ctx: FlagAskContext) => {
			const promptText = formatPromptMessage(ctx.name, ctx.definition);
			return await ctx.ux.askForToggle(promptText);
		},
		parse: (value: any): boolean => {
			if (typeof value === 'boolean') return value;
			const val = String(value).toLowerCase();
			if (val === 'true' || val === '1') return true;
			if (val === 'false' || val === '0') return false;
			return Boolean(value);
		},
		...opts,
		type: 'boolean',
	} as BooleanFlagDef & T;
}
