import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { BooleanFlagDef, FlagInput, FlagOpts, HasDefault } from '@/src/lib/types.js';

export function booleanFlag<const T extends FlagInput<BooleanFlagDef>>(opts?: T): BooleanFlagDef & T & HasDefault {
	return {
		default: false,
		ask: async (flagOpts: FlagOpts) => {
			const promptText = formatPromptMessage(flagOpts.name, flagOpts.definition);
			return await flagOpts.ux.askForToggle(promptText);
		},
		parse: (value: string | boolean, _opts: FlagOpts): boolean => {
			if (typeof value === 'boolean') return value;
			const val = String(value).toLowerCase();
			if (val === 'true' || val === '1') return true;
			if (val === 'false' || val === '0') return false;
			throw new ValidationError(`Invalid boolean value: "${value}". Expected true, false, 1, or 0.`);
		},
		...opts,
		type: 'boolean',
	} as BooleanFlagDef & T & HasDefault;
}
