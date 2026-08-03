import { encodeFishCandidates, renderFishScript } from '@/src/completion/fish.js';
import { CompletionCandidate, CompletionShell } from '@/src/completion/types.js';

export type CompletionScriptOptions = {
	binName: string;
};

/** Shells with a renderer today. `CompletionShell` lists the ones the seam is built for. */
export const IMPLEMENTED_SHELLS: CompletionShell[] = ['fish'];

export function isImplemented(shell: CompletionShell): boolean {
	return IMPLEMENTED_SHELLS.includes(shell);
}

/**
 * Renders the script a user installs to enable completion for `shell`.
 *
 * Throws for a shell without a renderer — callers facing a user should check {@link isImplemented}
 * first and report it as unsupported rather than letting this surface as a crash.
 */
export function renderCompletionScript(shell: CompletionShell, opts: CompletionScriptOptions): string {
	if (shell === 'fish') return renderFishScript(opts);

	throw new Error(`No completion renderer for ${shell} yet — implemented: ${IMPLEMENTED_SHELLS.join(', ')}`);
}

/** Serialises candidates in the wire format `shell` expects to read back. */
export function encodeCandidates(shell: CompletionShell, candidates: CompletionCandidate[]): string {
	if (shell === 'fish') return encodeFishCandidates(candidates);

	throw new Error(`No completion encoder for ${shell} yet — implemented: ${IMPLEMENTED_SHELLS.join(', ')}`);
}
