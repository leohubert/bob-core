import chalk from 'chalk';

import type { FlagDefinition } from '@/src/lib/types.js';

export function formatPromptMessage(name: string, definition: FlagDefinition): string {
	const isMultiple = definition.multiple === true;

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

/**
 * Formats an alias with the correct dash prefix for help/error output:
 * single-character aliases get one dash (`-v`), multi-character aliases get
 * two (`--verbose`). This matches POSIX/minimist parsing conventions.
 */
export function formatAlias(alias: string): string {
	return alias.length === 1 ? `-${alias}` : `--${alias}`;
}
