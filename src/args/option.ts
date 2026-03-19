import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { ArgInput, ArgOpts, OptionArgDef } from '@/src/lib/types.js';
import { parseOption } from '@/src/shared/parsers.js';

export function optionArg<const T extends readonly string[], const U extends ArgInput<OptionArgDef<T>, 'options'>>(
	opts: { options: T } & U,
): OptionArgDef<T> & U {
	return {
		default: opts.multiple ? [] : null,
		ask: async (argOpts: ArgOpts) => {
			const def = argOpts.definition;
			const isMultiple = 'multiple' in def && def.multiple;
			const promptText = formatPromptMessage(argOpts.name, def);

			if (def.type !== 'option') return null;
			const choices = def.options.map((o: string) => ({ name: o, value: o }));

			if (isMultiple) {
				return await argOpts.ux.askForCheckbox(promptText, choices);
			}

			return await argOpts.ux.askForSelect(promptText, choices);
		},
		parse: (value: string, _opts: ArgOpts): T[number] => parseOption(value, opts.options),
		...opts,
		type: 'option',
	} as OptionArgDef<T> & U;
}
