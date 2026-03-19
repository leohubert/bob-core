import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { ArgInput, ArgOpts, UrlArgDef } from '@/src/lib/types.js';
import { parseUrl } from '@/src/shared/parsers.js';

export function urlArg<const T extends ArgInput<UrlArgDef>>(opts?: T): UrlArgDef & T {
	return {
		default: null,
		ask: async (argOpts: ArgOpts) => {
			const promptText = formatPromptMessage(argOpts.name, argOpts.definition);
			return await argOpts.ux.askForInput(promptText, {
				validate: (value: string) => {
					if ((value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) && argOpts.definition.required) {
						return 'This value is required';
					}
					try {
						argOpts.definition.parse(value, argOpts);
					} catch (e) {
						if (e instanceof ValidationError) return e.message;
						return 'Invalid value';
					}
					return true;
				},
			});
		},
		parse: (input: string, _opts: ArgOpts) => parseUrl(input),
		...opts,
		type: 'url',
	} as UrlArgDef & T;
}
