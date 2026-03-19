import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FlagInput, FlagOpts, HasDefault, NumberFlagDef } from '@/src/lib/types.js';

type NumberFlagReturn<T> = T extends { default: NonNullable<NumberFlagDef['default']> }
	? NumberFlagDef & T & HasDefault
	: T extends { multiple: true }
		? NumberFlagDef & T & HasDefault
		: NumberFlagDef & T;

export function numberFlag<const T extends FlagInput<NumberFlagDef>>(opts?: T): NumberFlagReturn<T> {
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

			return await flagOpts.ux.askForNumber(promptText, {
				validate: (value: number | undefined) => {
					if (value === undefined && def.required) {
						return 'This value is required';
					}
					if (value !== undefined) {
						try {
							def.parse(String(value), flagOpts);
						} catch (e) {
							return e instanceof ValidationError ? e.message : 'Invalid value';
						}
					}
					return true;
				},
			});
		},
		parse: (value: string | number, _opts: FlagOpts): number => {
			const num = typeof value === 'number' ? value : Number(value);
			if (isNaN(num)) {
				throw new ValidationError('must be a valid number');
			}
			if (opts?.min !== undefined && num < opts.min) {
				throw new ValidationError(`is below minimum ${opts.min}`);
			}
			if (opts?.max !== undefined && num > opts.max) {
				throw new ValidationError(`exceeds maximum ${opts.max}`);
			}
			return num;
		},
		...opts,
		type: 'number',
	} as NumberFlagReturn<T>;
}
