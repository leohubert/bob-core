import chalk from 'chalk';

import type { FlagDefinition } from '@/src/lib/types.js';

export function formatPromptMessage(name: string, definition: FlagDefinition): string {
	const isMultiple = 'multiple' in definition && definition.multiple;

	let promptText = `${chalk.yellow.bold(name)} is required`;
	if (definition.description) {
		promptText += `: ${chalk.gray(`(${definition.description})`)}`;
	}
	promptText += ` ${chalk.green(`(${definition.type}${isMultiple ? '[]' : ''})`)}\n`;

	return promptText;
}
