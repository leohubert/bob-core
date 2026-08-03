import { Command } from '@/src/Command.js';
import { DynamicSlot, completeArgv } from '@/src/completion/complete.js';
import { CommandSpec } from '@/src/completion/specs.js';
import { CompletionCandidate } from '@/src/completion/types.js';
import { ContextDefinition, FlagDefinition } from '@/src/lib/types.js';

/** Loads a command class by canonical name. Only called when a dynamic slot is actually reached. */
export type CommandLoader = (name: string) => Promise<typeof Command | null> | typeof Command | null;

export type ResolveCompletionOptions = {
	specs: CommandSpec[];
	words: string[];
	/** Application context handed to `complete` — that is how a resolver reaches its services. */
	ctx?: ContextDefinition;
	loadCommand?: CommandLoader;
	/** Deadline for a dynamic resolver. A shell waiting on TAB must never hang. */
	timeoutMs?: number;
};

/** Long enough for a normal API round-trip, short enough that a stalled TAB is still a blip. */
const DEFAULT_TIMEOUT_MS = 1_500;

/**
 * Produces the candidates for a partially typed line, resolving dynamic values when the slot under
 * the cursor has them.
 *
 * The static path never touches `loadCommand`, which is what lets a host answer most keypresses
 * from a cached metadata snapshot without importing a single command module. Only a dynamic slot
 * pays for loading the real command.
 *
 * Every dynamic failure — no loader, missing command, resolver throwing, deadline passing — falls
 * back to whatever static candidates were found. Completion degrades; it does not break.
 */
export async function resolveCompletion(opts: ResolveCompletionOptions): Promise<CompletionCandidate[]> {
	const plan = completeArgv(opts.specs, opts.words);
	if (!plan.dynamic || !opts.loadCommand) return plan.candidates;

	const resolved = await resolveDynamic(plan.dynamic, opts);

	return dedupe([...plan.candidates, ...resolved]);
}

async function resolveDynamic(slot: DynamicSlot, opts: ResolveCompletionOptions): Promise<CompletionCandidate[]> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

	try {
		const Cmd = await opts.loadCommand!(slot.command);
		if (!Cmd) return [];

		const definition = definitionFor(Cmd, slot);
		if (typeof definition?.complete !== 'function') return [];

		const candidates = await Promise.race([
			Promise.resolve(
				definition.complete({
					term: slot.term,
					name: slot.parameter,
					ctx: opts.ctx,
					definition,
					cmd: Cmd,
					signal: controller.signal,
				}),
			),
			deadline(controller.signal),
		]);

		// Values are not prefix-filtered here: a resolver may match on a description or fuzzily, and
		// dropping those would defeat the point. Note that fish still filters by the typed token, so
		// a value the user cannot have typed a prefix of will not survive to the screen.
		return candidates.map(candidate => ({ ...candidate, value: `${slot.prefix}${candidate.value}` }));
	} catch {
		return [];
	} finally {
		clearTimeout(timer);
	}
}

function definitionFor(Cmd: typeof Command, slot: DynamicSlot): FlagDefinition | undefined {
	if (slot.kind === 'arg') return Cmd.args[slot.parameter];

	return Cmd.flags[slot.parameter] ?? Cmd.baseFlags[slot.parameter];
}

function deadline(signal: AbortSignal): Promise<never> {
	return new Promise((_resolve, reject) => {
		signal.addEventListener('abort', () => reject(new Error('completion timed out')), { once: true });
	});
}

/** A static option and a dynamically resolved value can coincide; the shell should see one entry. */
function dedupe(candidates: CompletionCandidate[]): CompletionCandidate[] {
	const seen = new Set<string>();

	return candidates.filter(candidate => {
		if (seen.has(candidate.value)) return false;
		seen.add(candidate.value);

		return true;
	});
}
