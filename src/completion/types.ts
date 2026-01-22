/**
 * Completion system type definitions for shell autocomplete
 */

/**
 * The type of completion being performed
 */
export enum CompletionType {
	/** Completing a command name */
	COMMAND = 'command',
	/** Completing an option flag (--option or -o) */
	OPTION = 'option',
	/** Completing a value for an option */
	OPTION_VALUE = 'option_value',
	/** Completing a positional argument */
	ARGUMENT = 'argument',
}

/**
 * Context information about the current completion request
 * Unified format parsed from shell-specific environment variables
 */
export interface CompletionContext {
	/** The full command line being completed */
	line: string;

	/** Cursor position in the line (character index) */
	point: number;

	/** The word currently being completed */
	currentWord: string;

	/** The word before the current word */
	previousWord: string;

	/** All words in the command line */
	words: string[];

	/** Index of the word being completed */
	wordIndex: number;

	/** The shell type (for shell-specific behavior if needed) */
	shell?: 'bash' | 'zsh' | 'fish';
}

/**
 * Result of a completion request
 */
export interface CompletionResult {
	/** Array of completion suggestions to present to the user */
	suggestions: string[];

	/** Optional metadata for debugging */
	debug?: {
		/** The type of completion that was performed */
		completionType: CompletionType;
		/** The command that was analyzed (if any) */
		analyzedCommand?: string;
		/** The argument position (if applicable) */
		position?: number;
	};
}

/**
 * Supported shell types for completion
 */
export type Shell = 'bash' | 'zsh' | 'fish';
