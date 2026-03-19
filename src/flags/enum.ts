import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { EnumFlagDef, FlagInput, FlagOpts, HasDefault } from '@/src/lib/types.js';

type EnumFlagReturn<T extends readonly string[], U> = U extends { default: NonNullable<EnumFlagDef<T>['default']> }
	? EnumFlagDef<T> & U & HasDefault
	: U extends { multiple: true }
		? EnumFlagDef<T> & U & HasDefault
		: EnumFlagDef<T> & U;

export function enumFlag<const T extends readonly string[], const U extends FlagInput<EnumFlagDef<T>, 'options'>>(
	opts: { options: T } & U,
): EnumFlagReturn<T, U> {
	return {
		default: opts.multiple ? [] : null,
		ask: async (flagOpts: FlagOpts) => {
			const def = flagOpts.definition;
			const isMultiple = 'multiple' in def && def.multiple;
			const promptText = formatPromptMessage(flagOpts.name, def);

			if (def.type !== 'enum') return null;
			const choices = def.options.map((o: string) => ({ name: o, value: o }));

			if (isMultiple) {
				return await flagOpts.ux.askForCheckbox(promptText, choices);
			}

			return await flagOpts.ux.askForSelect(promptText, choices);
		},
		parse: (value: string, _opts: FlagOpts): T[number] => {
			const str = String(value);
			if (!opts.options.includes(str as T[number])) {
				throw new ValidationError(`must be one of: ${opts.options.map(o => `"${o}"`).join(', ')}`);
			}
			return str as T[number];
		},
		...opts,
		type: 'enum',
	} as EnumFlagReturn<T, U>;
}
