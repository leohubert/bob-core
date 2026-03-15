import { askForMultipleValues, askForSingleInput, buildInputValidator, formatPromptMessage } from '@/src/flags/helpers.js';
import type { FlagAskContext, FlagInput, StringFlagDef } from '@/src/lib/types.js';

export function stringFlag<const T extends FlagInput<StringFlagDef>>(opts?: T): StringFlagDef & T {
	return {
		default: opts?.multiple ? [] : null,
		ask: async (ctx: FlagAskContext) => {
			const def = ctx.definition;
			const isMultiple = 'multiple' in def && def.multiple;

			if (isMultiple) return askForMultipleValues(ctx);

			if ('secret' in def && def.secret) {
				return ctx.ux.askForPassword(formatPromptMessage(ctx.name, def), { validate: buildInputValidator(def) });
			}

			return askForSingleInput(ctx);
		},
		parse: (value: any): string => {
			if (typeof value === 'boolean') {
				throw new Error(`Expected a string, got boolean "${value}"`);
			}
			return String(value);
		},
		...opts,
		type: 'string',
	} as StringFlagDef & T;
}
