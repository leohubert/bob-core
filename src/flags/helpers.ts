import chalk from 'chalk';

import type { FlagDefinition } from '@/src/lib/types.js';

export function formatPromptMessage(name: string, definition: FlagDefinition): string {
	const isMultiple = 'multiple' in definition && definition.multiple;

	let promptText = definition.required ? `${chalk.yellow.bold(name)} is required` : `Enter ${chalk.yellow.bold(name)}`;
	if (definition.description) {
		promptText += `: ${chalk.gray(`(${definition.description})`)}`;
	}
	promptText += ` ${chalk.green(`(${definition.type}${isMultiple ? '[]' : ''})`)}\n`;

	return promptText;
}

export function normalizeAliases(alias: string | readonly string[] | undefined): readonly string[] {
	if (alias == undefined) return [];
	return typeof alias === 'string' ? [alias] : alias;
}
