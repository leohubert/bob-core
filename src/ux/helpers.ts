import { ExitPromptError } from '@inquirer/core';

/**
 * Wraps an inquirer prompt so that cancellation (Ctrl+C / SIGINT, surfaced as
 * `ExitPromptError`) resolves to `fallback` instead of throwing. Every other
 * exception propagates so genuine failures stay visible.
 */
export async function withCancelHandling<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof ExitPromptError || (e instanceof Error && e.name === 'ExitPromptError')) return fallback;
		throw e;
	}
}
