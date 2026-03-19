import chalk from 'chalk';

import type { ArgDefinition, FlagDefinition } from '@/src/lib/types.js';

/**
 * Generates a standard prompt message for a missing required flag/argument
 */
export function formatPromptMessage(name: string, definition: FlagDefinition | ArgDefinition): string {
	const isMultiple = 'multiple' in definition && definition.multiple;

	let promptText = `${chalk.yellow.bold(name)} is required`;
	if (definition.description) {
		promptText += `: ${chalk.gray(`(${definition.description})`)}`;
	}
	promptText += ` ${chalk.green(`(${definition.type}${isMultiple ? '[]' : ''})`)}\n`;

	return promptText;
}
