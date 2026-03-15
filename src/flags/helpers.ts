import chalk from 'chalk';

import { ValidationError } from '@/src/errors/ValidationError.js';
import type { FlagAskContext, FlagDefinition } from '@/src/lib/types.js';

/**
 * Generates a standard prompt message for a missing required flag/argument
 */
export function formatPromptMessage(name: string, definition: FlagDefinition): string {
	const isMultiple = 'multiple' in definition && definition.multiple;

	let promptText = `${chalk.yellow.bold(name)} is required`;
	if (definition.description) {
		promptText += `: ${chalk.gray(`(${definition.description})`)}`;
	}
	promptText += ` ${chalk.green(`(${definition.type}${isMultiple ? '[]' : ''})`)}\n`;

	return promptText;
}

/**
 * Wraps a flag definition's parse function into a UX-compatible validator.
 * Catches ValidationError for clean messages, other errors get a generic message.
 */
export function buildInputValidator(definition: FlagDefinition): (value: string) => string | true {
	return (value: string) => {
		if ((value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) && definition.required) {
			return 'This value is required';
		}

		try {
			definition.parse(value, undefined);
		} catch (e) {
			if (e instanceof ValidationError) return e.message;
			return 'Invalid value';
		}

		return true;
	};
}

/**
 * Wraps a flag definition's parse function into a UX-compatible validator
 * for multiple comma-separated values. Calls parse per-item, catches ValidationError.
 */
export function buildMultipleValuesValidator(def: FlagDefinition): (value: string) => string | true {
	return (value: string) => {
		if ((value === null || value === undefined || value.trim() === '') && def.required) {
			return 'Please enter at least one value';
		}
		for (const raw of value.split(',')) {
			const trimmed = raw.trim();
			if (trimmed === '') continue;

			try {
				def.parse(trimmed, undefined);
			} catch (e) {
				if (e instanceof ValidationError) return `"${trimmed}": ${e.message}`;
				return `"${trimmed}": Invalid value`;
			}
		}
		return true;
	};
}

/**
 * Shared ask logic for multiple-value flags (string[], number[]).
 * Replaces the duplicated ~15-line branch in string and number ask methods.
 */
export async function askForMultipleValues(ctx: FlagAskContext): Promise<string[] | null> {
	const def = ctx.definition;
	const promptText = formatPromptMessage(ctx.name, def);

	return await ctx.ux.askForList(promptText + 'Please provide one or more values, separated by commas:\n', {
		separator: ',',
		validate: buildMultipleValuesValidator(def),
	});
}

/**
 * Shared ask logic for simple single-input flags (file, directory, url).
 * Replaces the identical 3-line ask implementations.
 */
export async function askForSingleInput(ctx: FlagAskContext): Promise<string | null> {
	const promptText = formatPromptMessage(ctx.name, ctx.definition);
	return await ctx.ux.askForInput(promptText, { validate: buildInputValidator(ctx.definition) });
}
