import { ValidationError } from '@/src/errors/ValidationError.js';
import { askForSingleInput } from '@/src/flags/helpers.js';
import type { FlagAskContext, FlagInput, UrlFlagDef } from '@/src/lib/types.js';

export function urlFlag<const T extends FlagInput<UrlFlagDef>>(opts?: T): UrlFlagDef & T {
	return {
		default: null,
		ask: async (ctx: FlagAskContext) => askForSingleInput(ctx),
		parse: (input: any) => {
			try {
				return new URL(String(input));
			} catch {
				throw new ValidationError(`Invalid URL: "${input}"`);
			}
		},
		...opts,
		type: 'url',
	} as UrlFlagDef & T;
}
