import { ExitPromptError } from '@inquirer/core';

export async function withCancelHandling<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof ExitPromptError || (e instanceof Error && e.name === 'ExitPromptError')) return fallback;
		throw e;
	}
}
