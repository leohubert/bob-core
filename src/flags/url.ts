import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FlagInput, FlagOpts, HasDefault, UrlFlagDef } from '@/src/lib/types.js';

type UrlFlagReturn<T> = T extends { default: NonNullable<UrlFlagDef['default']> } ? UrlFlagDef & T & HasDefault : UrlFlagDef & T;

export function urlFlag<const T extends FlagInput<UrlFlagDef>>(opts?: T): UrlFlagReturn<T> {
	return {
		default: null,
		ask: async (flagOpts: FlagOpts) => {
			const promptText = formatPromptMessage(flagOpts.name, flagOpts.definition);
			return await flagOpts.ux.askForInput(promptText, {
				validate: (value: string) => {
					if ((value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) && flagOpts.definition.required) {
						return 'This value is required';
					}
					try {
						flagOpts.definition.parse(value, flagOpts);
					} catch (e) {
						if (e instanceof ValidationError) return e.message;
						return 'Invalid value';
					}
					return true;
				},
			});
		},
		parse: (input: string, _opts: FlagOpts) => {
			try {
				return new URL(String(input));
			} catch {
				throw new ValidationError(`Invalid URL: "${input}"`);
			}
		},
		...opts,
		type: 'url',
	} as UrlFlagReturn<T>;
}
