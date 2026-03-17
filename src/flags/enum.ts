import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { EnumFlagDef, FlagAskContext, FlagInput } from '@/src/lib/types.js';

export function enumFlag<const T extends readonly string[], const U extends FlagInput<EnumFlagDef<T>, 'options'>>(
	opts: { options: T } & U,
): EnumFlagDef<T> & U {
	return {
		default: opts.multiple ? [] : null,
		ask: async (ctx: FlagAskContext) => {
			const def = ctx.definition;
			const isMultiple = 'multiple' in def && def.multiple;
			const promptText = formatPromptMessage(ctx.name, def);

			if (def.type !== 'enum') return null;
			const choices = def.options.map((o: string) => ({ name: o, value: o }));

			if (isMultiple) {
				return await ctx.ux.askForCheckbox(promptText, choices);
			}

			return await ctx.ux.askForSelect(promptText, choices);
		},
		parse: (value: any): T[number] => {
			const str = String(value);
			if (!opts.options.includes(str as T[number])) {
				throw new ValidationError(`must be one of: ${opts.options.map(o => `"${o}"`).join(', ')}`);
			}
			return str as T[number];
		},
		...opts,
		type: 'enum',
	} as EnumFlagDef<T> & U;
}
