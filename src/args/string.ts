import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { ArgInput, ArgOpts, StringArgDef } from '@/src/lib/types.js';
import { parseString } from '@/src/shared/parsers.js';

export function stringArg<const T extends ArgInput<StringArgDef>>(opts?: T): StringArgDef & T {
	return {
		default: opts?.multiple ? [] : null,
		ask: async (argOpts: ArgOpts) => {
			const def = argOpts.definition;
			const isMultiple = 'multiple' in def && def.multiple;
			const promptText = formatPromptMessage(argOpts.name, def);

			if (isMultiple) {
				return await argOpts.ux.askForList(promptText + 'Please provide one or more values, separated by commas:\n', {
					separator: ',',
					validate: (value: string) => {
						if ((value === null || value === undefined || value.trim() === '') && def.required) {
							return 'Please enter at least one value';
						}
						for (const raw of value.split(',')) {
							const trimmed = raw.trim();
							if (trimmed === '') continue;
							try {
								def.parse(trimmed, argOpts);
							} catch (e) {
								if (e instanceof ValidationError) return `"${trimmed}": ${e.message}`;
								return `"${trimmed}": Invalid value`;
							}
						}
						return true;
					},
				});
			}

			return await argOpts.ux.askForInput(promptText, {
				validate: (value: string) => {
					if ((value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) && def.required) {
						return 'This value is required';
					}
					try {
						def.parse(value, argOpts);
					} catch (e) {
						if (e instanceof ValidationError) return e.message;
						return 'Invalid value';
					}
					return true;
				},
			});
		},
		parse: (value: string, _opts: ArgOpts): string => parseString(value),
		...opts,
		type: 'string',
	} as StringArgDef & T;
}
