import { describe, expect, it, vi } from 'vitest';

import { Command } from '@/src/Command.js';
import { searchFlag } from '@/src/flags/search.js';
import type { FlagOpts } from '@/src/lib/types.js';
import { UX } from '@/src/ux/index.js';

const ISSUES = [
	{ name: 'PET-1 — first', value: 'PET-1' },
	{ name: 'ABC-2 — second', value: 'ABC-2' },
];

function optsFor(definition: any, overrides: Partial<FlagOpts> = {}): FlagOpts<any, any> {
	return {
		name: 'issueId',
		ux: new UX(),
		ctx: { who: 'me' },
		definition,
		cmd: Command,
		...overrides,
	} as FlagOpts<any, any>;
}

describe('searchFlag', () => {
	it('drives the interactive prompt from the source', async () => {
		// The prompt half of the contract: one `source` must serve it as well as completion, which is
		// the whole reason this builder exists instead of a hand-written `ask`.
		const source = vi.fn(async () => ISSUES);
		const definition = searchFlag({ source });

		const askForSearch = vi.fn().mockResolvedValue('PET-1');
		const ux = { askForSearch } as unknown as UX;

		const answer = await definition.ask!(optsFor(definition, { ux }));

		expect(answer).toBe('PET-1');
		expect(askForSearch).toHaveBeenCalledOnce();

		// The prompt is handed the source, not a fixed list — verify it actually resolves through it.
		const [, passedSource] = askForSearch.mock.calls[0];
		await expect(passedSource('PET', { signal: undefined })).resolves.toEqual(ISSUES);
		expect(source).toHaveBeenCalledWith(expect.objectContaining({ term: 'PET', ctx: { who: 'me' }, name: 'issueId' }));
	});

	it('normalises the prompt term, since inquirer passes undefined on first render', async () => {
		const source = vi.fn(async () => ISSUES);
		const definition = searchFlag({ source });

		const askForSearch = vi.fn().mockResolvedValue(null);
		await definition.ask!(optsFor(definition, { ux: { askForSearch } as unknown as UX }));

		await askForSearch.mock.calls[0][1](undefined, { signal: undefined });

		expect(source).toHaveBeenCalledWith(expect.objectContaining({ term: '' }));
	});

	it('resolves completion candidates from the same source', async () => {
		const source = vi.fn(async () => ISSUES);
		const definition = searchFlag({ source });

		const candidates = await definition.complete!({
			term: 'PET',
			name: 'issueId',
			ctx: {},
			definition,
			cmd: Command,
			signal: AbortSignal.timeout(1_000),
		});

		expect(candidates).toEqual([
			{ value: 'PET-1', description: 'PET-1 — first' },
			{ value: 'ABC-2', description: 'ABC-2 — second' },
		]);
	});

	it('prefers an explicit description over the display label', async () => {
		const definition = searchFlag({ source: async () => [{ name: 'PET-1 — first', value: 'PET-1', description: 'just the title' }] });

		const candidates = await definition.complete!({
			term: '',
			name: 'issueId',
			ctx: {},
			definition,
			cmd: Command,
			signal: AbortSignal.timeout(1_000),
		});

		expect(candidates).toEqual([{ value: 'PET-1', description: 'just the title' }]);
	});

	it('forwards the abort signal so a resolver can stop when the deadline passes', async () => {
		let observed: AbortSignal | undefined;
		const definition = searchFlag({
			source: async ({ signal }) => {
				observed = signal;

				return [];
			},
		});
		const signal = AbortSignal.timeout(1_000);

		await definition.complete!({ term: '', name: 'issueId', ctx: {}, definition, cmd: Command, signal });

		expect(observed).toBe(signal);
	});

	it('parses to the typed string, so a value supplied on the command line still works', () => {
		const definition = searchFlag({ source: async () => ISSUES });

		expect(definition.parse('PET-9', optsFor(definition))).toBe('PET-9');
	});
});
