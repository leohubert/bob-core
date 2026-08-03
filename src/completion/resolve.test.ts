import { describe, expect, it, vi } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { Args } from '@/src/args/index.js';
import { completeArgv } from '@/src/completion/complete.js';
import { resolveCompletion } from '@/src/completion/resolve.js';
import { commandSpecs } from '@/src/completion/specs.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagsSchema } from '@/src/lib/types.js';

type TestContext = { issues: string[] };

/** Stands in for a Linear-backed lookup: values only knowable by asking a service. */
const issueSource = vi.fn(async (opts: { term: string; ctx: any; signal?: AbortSignal }) => {
	const issues: string[] = opts.ctx?.issues ?? [];

	return issues.filter(issue => issue.startsWith(opts.term)).map(issue => ({ name: `${issue} — a ticket`, value: issue }));
});

class PrCommand extends Command {
	static command = 'make:pr';
	static args = { issueId: Args.search({ source: issueSource, required: true }) } satisfies FlagsSchema;
	static flags = {
		reviewer: Flags.search({ source: issueSource, description: 'Reviewer' }),
		title: Flags.string(),
		env: Flags.option({ options: ['dev', 'prd'] as const }),
	} satisfies FlagsSchema;
	async handle() {}
}

function setup() {
	const registry = new CommandRegistry();
	registry.registerCommand(PrCommand);

	return {
		specs: commandSpecs(registry),
		ctx: { issues: ['PET-1', 'PET-2', 'ABC-9'] } satisfies TestContext,
		loadCommand: (name: string) => registry.findCommand(name),
	};
}

function values(candidates: Array<{ value: string }>): string[] {
	return candidates.map(candidate => candidate.value);
}

describe('dynamic completion', () => {
	it('marks a search-backed slot as dynamic, since a snapshot cannot hold live values', () => {
		const { specs } = setup();

		expect(completeArgv(specs, ['make:pr', '']).dynamic).toMatchObject({
			command: 'make:pr',
			kind: 'arg',
			parameter: 'issueId',
			term: '',
		});
	});

	it('does not mark a statically-valued slot as dynamic, so the fast path stays fast', () => {
		const { specs } = setup();

		expect(completeArgv(specs, ['make:pr', '--env', '']).dynamic).toBeUndefined();
		expect(completeArgv(specs, ['make:pr', '--'])?.dynamic).toBeUndefined();
	});

	it('resolves values from the live source for a positional', async () => {
		const { specs, ctx, loadCommand } = setup();

		const candidates = await resolveCompletion({ specs, words: ['make:pr', 'PET-'], ctx, loadCommand });

		expect(values(candidates)).toEqual(['PET-1', 'PET-2']);
	});

	it('passes the typed term through, so the source can query instead of returning everything', async () => {
		const { specs, ctx, loadCommand } = setup();
		issueSource.mockClear();

		await resolveCompletion({ specs, words: ['make:pr', 'PET-1'], ctx, loadCommand });

		expect(issueSource).toHaveBeenCalledWith(expect.objectContaining({ term: 'PET-1' }));
	});

	it('hands the app context to the source — that is how it reaches its services', async () => {
		const { specs, loadCommand } = setup();

		const candidates = await resolveCompletion({ specs, words: ['make:pr', ''], ctx: { issues: ['ZZ-1'] }, loadCommand });

		expect(values(candidates)).toEqual(['ZZ-1']);
	});

	it('uses the human-readable label as the description', async () => {
		const { specs, ctx, loadCommand } = setup();

		const candidates = await resolveCompletion({ specs, words: ['make:pr', 'ABC-9'], ctx, loadCommand });

		expect(candidates[0]).toEqual({ value: 'ABC-9', description: 'ABC-9 — a ticket' });
	});

	it('resolves a flag value too, not just positionals', async () => {
		const { specs, ctx, loadCommand } = setup();

		const candidates = await resolveCompletion({ specs, words: ['make:pr', '--reviewer', 'PET-'], ctx, loadCommand });

		expect(values(candidates)).toEqual(['PET-1', 'PET-2']);
	});

	it('keeps the --flag= form intact, since the shell replaces the whole token', async () => {
		const { specs, ctx, loadCommand } = setup();

		const candidates = await resolveCompletion({ specs, words: ['make:pr', '--reviewer=PET-'], ctx, loadCommand });

		expect(values(candidates)).toEqual(['--reviewer=PET-1', '--reviewer=PET-2']);
	});

	describe('degradation', () => {
		it('never loads a command when nothing dynamic is reached', async () => {
			const { specs, ctx } = setup();
			const loadCommand = vi.fn();

			await resolveCompletion({ specs, words: ['make:pr', '--env', ''], ctx, loadCommand });

			// The entire point of the snapshot: a static keypress must not pay for importing commands.
			expect(loadCommand).not.toHaveBeenCalled();
		});

		it('falls back to static candidates when no loader is available', async () => {
			const { specs, ctx } = setup();

			const candidates = await resolveCompletion({ specs, words: ['make:pr', 'PET-'], ctx });

			expect(candidates).toEqual([]);
		});

		it('survives a source that throws instead of breaking the prompt', async () => {
			const { specs, ctx } = setup();
			issueSource.mockRejectedValueOnce(new Error('network down'));

			await expect(resolveCompletion({ specs, words: ['make:pr', ''], ctx, loadCommand: setup().loadCommand })).resolves.toEqual([]);
		});

		it('gives up on a hanging source rather than freezing the shell on TAB', async () => {
			const { specs, ctx, loadCommand } = setup();
			issueSource.mockImplementationOnce(() => new Promise(() => {}));

			const candidates = await resolveCompletion({ specs, words: ['make:pr', ''], ctx, loadCommand, timeoutMs: 30 });

			expect(candidates).toEqual([]);
		});

		it('aborts the signal it handed the source, so the work stops too', async () => {
			const { specs, ctx, loadCommand } = setup();
			let observed: AbortSignal | undefined;
			issueSource.mockImplementationOnce(opts => {
				observed = opts.signal;

				return new Promise(() => {});
			});

			await resolveCompletion({ specs, words: ['make:pr', ''], ctx, loadCommand, timeoutMs: 30 });

			expect(observed?.aborted).toBe(true);
		});

		it('returns static candidates even when the dynamic half fails', async () => {
			// A slot can have both: a few known values plus a live lookup.
			class Both extends Command {
				static command = 'both';
				static args = {
					target: Args.search({ source: async () => [{ name: 'live', value: 'live-1' }], options: ['static-1'] as any }),
				} satisfies FlagsSchema;
				async handle() {}
			}
			const registry = new CommandRegistry();
			registry.registerCommand(Both);

			const candidates = await resolveCompletion({
				specs: commandSpecs(registry),
				words: ['both', ''],
				loadCommand: () => null,
			});

			expect(values(candidates)).toEqual(['static-1']);
		});

		it('does not repeat a value offered both statically and dynamically', async () => {
			class Both extends Command {
				static command = 'both';
				static args = {
					target: Args.search({ source: async () => [{ name: 'dup', value: 'dup' }], options: ['dup'] as any }),
				} satisfies FlagsSchema;
				async handle() {}
			}
			const registry = new CommandRegistry();
			registry.registerCommand(Both);

			const candidates = await resolveCompletion({
				specs: commandSpecs(registry),
				words: ['both', ''],
				loadCommand: name => registry.findCommand(name),
			});

			expect(values(candidates)).toEqual(['dup']);
		});
	});
});
