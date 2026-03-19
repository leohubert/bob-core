import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FlagInput, FlagOpts, HasDefault, StringFlagDef } from '@/src/lib/types.js';

type StringFlagReturn<T> = T extends { default: NonNullable<StringFlagDef['default']> }
	? StringFlagDef & T & HasDefault
	: T extends { multiple: true }
		? StringFlagDef & T & HasDefault
		: StringFlagDef & T;

export function stringFlag<const T extends FlagInput<StringFlagDef>>(opts?: T): StringFlagReturn<T> {
	return {
		default: opts?.multiple ? [] : null,
		ask: async (flagOpts: FlagOpts) => {
			const def = flagOpts.definition;
			const isMultiple = 'multiple' in def && def.multiple;
			const promptText = formatPromptMessage(flagOpts.name, def);

			if (isMultiple) {
				return await flagOpts.ux.askForList(promptText + 'Please provide one or more values, separated by commas:\n', {
					separator: ',',
					validate: (value: string) => {
						if ((value === null || value === undefined || value.trim() === '') && def.required) {
							return 'Please enter at least one value';
						}
						for (const raw of value.split(',')) {
							const trimmed = raw.trim();
							if (trimmed === '') continue;
							try {
								def.parse(trimmed, flagOpts);
							} catch (e) {
								if (e instanceof ValidationError) return `"${trimmed}": ${e.message}`;
								return `"${trimmed}": Invalid value`;
							}
						}
						return true;
					},
				});
			}

			if ('secret' in def && def.secret) {
				return flagOpts.ux.askForPassword(promptText, {
					validate: (value: string) => {
						if ((value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) && def.required) {
							return 'This value is required';
						}
						try {
							def.parse(value, flagOpts);
						} catch (e) {
							if (e instanceof ValidationError) return e.message;
							return 'Invalid value';
						}
						return true;
					},
				});
			}

			return await flagOpts.ux.askForInput(promptText, {
				validate: (value: string) => {
					if ((value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) && def.required) {
						return 'This value is required';
					}
					try {
						def.parse(value, flagOpts);
					} catch (e) {
						if (e instanceof ValidationError) return e.message;
						return 'Invalid value';
					}
					return true;
				},
			});
		},
		parse: (value: string, _opts: FlagOpts): string => {
			if (typeof value === 'boolean') {
				throw new Error(`Expected a string, got boolean "${value}"`);
			}
			return String(value);
		},
		...opts,
		type: 'string',
	} as StringFlagReturn<T>;
}
