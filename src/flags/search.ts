import { custom } from '@/src/flags/custom.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { CompletionOpts, ContextDefinition, FlagOpts, InitFlagDefinition } from '@/src/lib/types.js';
import { parseString } from '@/src/shared/parsers.js';
import type { SelectOption } from '@/src/ux/types.js';

/**
 * Where the candidate values come from. Called with the partial value typed so far — empty on a
 * fresh prompt or an untouched completion slot.
 *
 * `ctx` is the application context, which is how a source reaches its services (an API client, the
 * git repo). Pass `signal` on to any network call so both the completion deadline and a cancelled
 * prompt can abort it.
 */
export type ValueSource<V = string> = (opts: {
	term: string;
	ctx: ContextDefinition;
	name: string;
	signal?: AbortSignal;
}) => Promise<Array<SelectOption<V>>> | Array<SelectOption<V>>;

export type SearchFlagOptions<V = string> = {
	source: ValueSource<V>;
};

/**
 * A value looked up from a live source rather than chosen from a fixed list — a ticket, a branch, a
 * namespace.
 *
 * The point of this builder is that the source is declared **once** and drives both paths:
 *
 *  - interactively, it backs an `askForSearch` prompt when the value is missing;
 *  - at the shell, it backs `complete`, so TAB offers the same live values.
 *
 * Prefer this over hand-writing `ask`, which only covers the prompt and leaves completion blind.
 */
export function searchFlag<
	const V extends string = string,
	const O extends Partial<InitFlagDefinition<V, SearchFlagOptions<V>>> = Partial<InitFlagDefinition<V, SearchFlagOptions<V>>>,
>(opts: SearchFlagOptions<V> & O) {
	return custom<V, SearchFlagOptions<V>>({
		type: 'custom',
		parse: v => parseString(v) as V,

		// Typed loosely, like the other `build*Ask` helpers: the builder-specific `source` makes the
		// definition invariant, which a precisely-typed callback cannot express here.
		ask: async (builderOpts: FlagOpts<any, any>) => {
			const { source } = builderOpts.definition as unknown as SearchFlagOptions<V>;

			return builderOpts.ux.askForSearch<V>(formatPromptMessage(builderOpts.name, builderOpts.definition), (term, { signal }) =>
				source({ term: term ?? '', ctx: builderOpts.ctx, name: builderOpts.name, signal }),
			);
		},

		complete: async (completionOpts: CompletionOpts<V, SearchFlagOptions<V>>) => {
			const { source } = completionOpts.definition as unknown as SearchFlagOptions<V>;

			const options = await source({
				term: completionOpts.term,
				ctx: completionOpts.ctx,
				name: completionOpts.name,
				signal: completionOpts.signal,
			});

			// The value is what gets typed; the human-readable label becomes the shell's description.
			return options.map(option => ({ value: String(option.value), description: option.description ?? option.name }));
		},
	})(opts);
}
