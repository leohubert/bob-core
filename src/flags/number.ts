import { askForMultipleValues, formatPromptMessage } from '@/src/flags/helpers.js';
import { ValidationError } from '@/src/errors/ValidationError.js';
import type { FlagAskContext, FlagInput, NumberFlagDef } from '@/src/lib/types.js';

export function numberFlag<const T extends FlagInput<NumberFlagDef>>(opts?: T): NumberFlagDef & T {
	return {
		default: opts?.multiple ? [] : null,
		ask: async (ctx: FlagAskContext) => {
			const def = ctx.definition;
			const isMultiple = 'multiple' in def && def.multiple;
			const promptText = formatPromptMessage(ctx.name, def);

			if (isMultiple) return askForMultipleValues(ctx);

			return await ctx.ux.askForNumber(promptText, {
				validate: (value: number | undefined) => {
					if (value === undefined && def.required) {
						return 'This value is required';
					}
					if (value !== undefined) {
						try {
							def.parse(String(value), undefined);
						} catch (e) {
							return e instanceof ValidationError ? e.message : 'Invalid value';
						}
					}
					return true;
				},
			});
		},
		parse: (value: any): number => {
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
	} as NumberFlagDef & T;
}
