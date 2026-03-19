import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FlagInput, FlagOpts, OptionFlagDef } from '@/src/lib/types.js';
import { parseOption } from '@/src/shared/parsers.js';

export function optionFlag<const T extends readonly string[], const U extends FlagInput<OptionFlagDef<T>, 'options'>>(
	opts: { options: T } & U,
): OptionFlagDef<T> & U {
	return {
		default: opts.multiple ? [] : null,
		ask: async (flagOpts: FlagOpts) => {
			const def = flagOpts.definition;
			const isMultiple = 'multiple' in def && def.multiple;
			const promptText = formatPromptMessage(flagOpts.name, def);

			if (def.type !== 'option') return null;
			const choices = def.options.map((o: string) => ({ name: o, value: o }));

			if (isMultiple) {
				return await flagOpts.ux.askForCheckbox(promptText, choices);
			}

			return await flagOpts.ux.askForSelect(promptText, choices);
		},
		parse: (value: string, _opts: FlagOpts): T[number] => parseOption(value, opts.options),
		...opts,
		type: 'option',
	} as OptionFlagDef<T> & U;
}
