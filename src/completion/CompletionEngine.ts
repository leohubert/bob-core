import { Command } from '@/src/Command.js';
import { CommandIO } from '@/src/CommandIO.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { CompletionContext, CompletionResult, CompletionType } from '@/src/completion/types.js';
import { getOptionDetails } from '@/src/lib/optionHelpers.js';
import { OptionDefinition } from '@/src/lib/types.js';

/**
 * Core completion engine that generates suggestions based on command schemas
 */
export class CompletionEngine {
	constructor(private readonly commandRegistry: CommandRegistry) {}

	/**
	 * Generate completions based on the current completion context
	 *
	 * @param context - The completion context
	 * @returns Completion result with suggestions
	 */
	generateCompletions(context: CompletionContext): CompletionResult {
		const type = this.analyzeCompletionType(context);
		let suggestions: string[] = [];

		switch (type) {
			case CompletionType.COMMAND:
				suggestions = this.getCommandSuggestions(context.currentWord);
				break;

			case CompletionType.OPTION: {
				const commandName = this.parseCommandFromInput(context);
				if (commandName) {
					const command = this.findCommand(commandName);
					if (command) {
						const usedOptions = this.getUsedOptions(context);
						suggestions = this.getOptionSuggestions(command, context.currentWord, usedOptions);
					}
				}
				break;
			}

			case CompletionType.OPTION_VALUE: {
				suggestions = this.getOptionValueSuggestions(context);
				break;
			}

			case CompletionType.ARGUMENT: {
				const commandName = this.parseCommandFromInput(context);
				if (commandName) {
					const command = this.findCommand(commandName);
					if (command) {
						const position = this.getArgumentPosition(context);
						suggestions = this.getArgumentSuggestions(command, position, context.currentWord);
					}
				}
				break;
			}
		}

		return {
			suggestions: this.filterByPrefix(suggestions, context.currentWord),
			debug: {
				completionType: type,
				analyzedCommand: this.parseCommandFromInput(context) || undefined,
			},
		};
	}

	/**
	 * Analyze the completion context to determine what type of completion to perform
	 */
	private analyzeCompletionType(context: CompletionContext): CompletionType {
		// If completing the first word (or no words yet), completing command
		if (context.wordIndex <= 1) {
			return CompletionType.COMMAND;
		}

		// If current word starts with -, completing option
		if (context.currentWord.startsWith('-')) {
			return CompletionType.OPTION;
		}

		// If previous word was an option that requires a value, completing option value
		if (context.previousWord.startsWith('-')) {
			const commandName = this.parseCommandFromInput(context);
			if (commandName) {
				const command = this.findCommand(commandName);
				if (command) {
					const optionName = this.cleanOptionName(context.previousWord);
					const optionDef = this.getOptionDefinition(command, optionName);
					if (optionDef && optionDef.type !== 'boolean') {
						return CompletionType.OPTION_VALUE;
					}
				}
			}
		}

		// Otherwise, completing positional argument
		return CompletionType.ARGUMENT;
	}

	/**
	 * Extract command name from the completion context
	 */
	private parseCommandFromInput(context: CompletionContext): string | null {
		// Command name is typically the second word (after the CLI name)
		if (context.words.length >= 2) {
			const potentialCommand = context.words[1];
			// Make sure it's not an option
			if (!potentialCommand.startsWith('-')) {
				return potentialCommand;
			}
		}
		return null;
	}

	/**
	 * Find a command by name in the registry
	 */
	private findCommand(commandName: string): Command | null {
		return this.commandRegistry.getCommands().find(c => c.command === commandName) || null;
	}

	/**
	 * Get command name suggestions
	 */
	private getCommandSuggestions(partial: string): string[] {
		return this.commandRegistry.getAvailableCommands();
	}

	/**
	 * Get option suggestions for a command
	 */
	private getOptionSuggestions(command: Command, partial: string, alreadyUsed: Set<string>): string[] {
		const suggestions: string[] = [];

		try {
			// Create a temporary parser to get option definitions
			// We use a dummy IO since we're only reading definitions
			const dummyIO = { logger: { log: () => {} } } as CommandIO;
			const parser = command['newCommandParser']({
				io: dummyIO,
				options: command['tmp']?.options ?? {},
				arguments: command['tmp']?.arguments ?? {},
			});

			const optionDefs = parser.optionDefinitions();

			for (const [name, def] of Object.entries(optionDefs)) {
				// Check if this option (or any of its aliases) has been used
				const isUsed = alreadyUsed.has(name) || def.alias.some(alias => alreadyUsed.has(alias));

				// Skip already-used options (unless they're arrays)
				if (isUsed && !Array.isArray(def.type)) {
					continue;
				}

				// Add long form (--option)
				suggestions.push(`--${name}`);

				// Add aliases
				for (const alias of def.alias) {
					const formattedAlias = alias.length === 1 ? `-${alias}` : `--${alias}`;
					suggestions.push(formattedAlias);
				}
			}
		} catch (error) {
			// If we can't create the parser, just return empty suggestions
			// This is fine for completion - we fail silently
		}

		return suggestions;
	}

	/**
	 * Get option value suggestions (type-based hints)
	 */
	private getOptionValueSuggestions(context: CompletionContext): string[] {
		const commandName = this.parseCommandFromInput(context);
		if (!commandName) return [];

		const command = this.findCommand(commandName);
		if (!command) return [];

		const optionName = this.cleanOptionName(context.previousWord);
		const optionDef = this.getOptionDefinition(command, optionName);

		if (!optionDef) return [];

		// For boolean types, suggest true/false
		if (optionDef.type === 'boolean') {
			return ['true', 'false'];
		}

		// For other types, no suggestions (user must provide value)
		// In the future, this could be extended to support custom completion providers
		return [];
	}

	/**
	 * Get argument suggestions for a command
	 */
	private getArgumentSuggestions(command: Command, position: number, partial: string): string[] {
		try {
			const dummyIO = { logger: { log: () => {} } } as CommandIO;
			const parser = command['newCommandParser']({
				io: dummyIO,
				options: command['tmp']?.options ?? {},
				arguments: command['tmp']?.arguments ?? {},
			});

			const argDefs = parser.argumentDefinitions();
			const argNames = Object.keys(argDefs);

			// Get argument at this position
			if (position < argNames.length) {
				const argName = argNames[position];
				const argDef = argDefs[argName];

				// Provide type hints
				return this.getArgumentTypeHints(argDef);
			}
		} catch (error) {
			// Fail silently for completion
		}

		return [];
	}

	/**
	 * Get type hints for an argument
	 */
	private getArgumentTypeHints(def: OptionDefinition): string[] {
		// For boolean types, suggest true/false
		if (def.type === 'boolean') {
			return ['true', 'false'];
		}

		// For other types, no suggestions
		// In the future, this could be extended with custom providers
		return [];
	}

	/**
	 * Get the position of the current argument (excluding options)
	 */
	private getArgumentPosition(context: CompletionContext): number {
		let position = 0;

		// Skip CLI name and command name
		for (let i = 2; i < context.wordIndex; i++) {
			const word = context.words[i];

			// Skip options and their values
			if (word.startsWith('-')) {
				// Check if this option takes a value
				const commandName = this.parseCommandFromInput(context);
				if (commandName) {
					const command = this.findCommand(commandName);
					if (command) {
						const optionName = this.cleanOptionName(word);
						const optionDef = this.getOptionDefinition(command, optionName);

						// If option takes a value, skip the next word too
						if (optionDef && optionDef.type !== 'boolean' && i + 1 < context.wordIndex) {
							i++; // Skip the option value
						}
					}
				}
			} else {
				// This is a positional argument
				position++;
			}
		}

		return position;
	}

	/**
	 * Get the set of already-used options
	 */
	private getUsedOptions(context: CompletionContext): Set<string> {
		const used = new Set<string>();

		// Start from word 2 (skip CLI name and command name)
		for (let i = 2; i < context.wordIndex; i++) {
			const word = context.words[i];
			if (word.startsWith('-')) {
				const optionName = this.cleanOptionName(word);
				used.add(optionName);
			}
		}

		return used;
	}

	/**
	 * Clean option name by removing leading dashes and handling = syntax
	 */
	private cleanOptionName(option: string): string {
		// Remove leading dashes
		let cleaned = option.replace(/^-+/, '');

		// Handle --option=value syntax
		const equalIndex = cleaned.indexOf('=');
		if (equalIndex !== -1) {
			cleaned = cleaned.substring(0, equalIndex);
		}

		return cleaned;
	}

	/**
	 * Get option definition by name or alias
	 */
	private getOptionDefinition(command: Command, optionName: string): OptionDefinition | null {
		try {
			const dummyIO = { logger: { log: () => {} } } as CommandIO;
			const parser = command['newCommandParser']({
				io: dummyIO,
				options: command['tmp']?.options ?? {},
				arguments: command['tmp']?.arguments ?? {},
			});

			const optionDefs = parser.optionDefinitions();

			// Check if it's a direct match
			if (optionDefs[optionName]) {
				return optionDefs[optionName];
			}

			// Check if it's an alias
			for (const [name, def] of Object.entries(optionDefs)) {
				if (def.alias.includes(optionName)) {
					return def;
				}
			}
		} catch (error) {
			// Fail silently
		}

		return null;
	}

	/**
	 * Filter suggestions by prefix match
	 */
	private filterByPrefix(suggestions: string[], prefix: string): string[] {
		if (!prefix) {
			return suggestions;
		}

		return suggestions.filter(s => s.startsWith(prefix));
	}
}
