import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { ArgInput, ArgOpts, NumberArgDef } from '@/src/lib/types.js';
import { parseNumber } from '@/src/shared/parsers.js';

export function numberArg<const T extends ArgInput<NumberArgDef>>(opts?: T): NumberArgDef & T {
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

			return await argOpts.ux.askForNumber(promptText, {
				validate: (value: number | undefined) => {
					if (value === undefined && def.required) {
						return 'This value is required';
					}
					if (value !== undefined) {
						try {
							def.parse(String(value), argOpts);
						} catch (e) {
							return e instanceof ValidationError ? e.message : 'Invalid value';
						}
					}
					return true;
				},
			});
		},
		parse: (value: string | number, _opts: ArgOpts): number => parseNumber(value, { min: opts?.min, max: opts?.max }),
		...opts,
		type: 'number',
	} as NumberArgDef & T;
}
