import { CompletionContext } from '@/src/completion/types.js';

/**
 * Parses shell-specific environment variables and arguments into a unified CompletionContext
 */
export class CompletionContextParser {
	/**
	 * Parse Bash/Zsh completion environment variables into a CompletionContext
	 *
	 * Expected environment variables:
	 * - COMP_LINE: The full command line
	 * - COMP_POINT: Cursor position (character index)
	 * - COMP_CWORD: Index of the word being completed
	 * - COMP_WORDS: Space-separated words (may not respect quotes properly)
	 *
	 * @param env - Process environment variables
	 * @param shell - The shell type (bash or zsh)
	 * @returns Parsed completion context
	 */
	static parseBashContext(env: NodeJS.ProcessEnv, shell: 'bash' | 'zsh' = 'bash'): CompletionContext {
		const line = env.COMP_LINE || '';
		const point = parseInt(env.COMP_POINT || '0', 10);
		const wordIndex = parseInt(env.COMP_CWORD || '0', 10);

		// Parse words from the command line (respecting quotes)
		const words = this.parseWords(line);

		// Determine current and previous word
		const currentWord = words[wordIndex] || '';
		const previousWord = wordIndex > 0 ? words[wordIndex - 1] : '';

		return {
			line,
			point,
			currentWord,
			previousWord,
			words,
			wordIndex,
			shell,
		};
	}

	/**
	 * Parse Fish completion arguments into a CompletionContext
	 *
	 * Fish passes completion context differently than Bash/Zsh
	 * It typically provides the command line as arguments
	 *
	 * @param args - Command line arguments from Fish
	 * @returns Parsed completion context
	 */
	static parseFishContext(args: string[]): CompletionContext {
		// Fish completion typically receives the current command line as args
		// We need to parse --line and --point flags if provided
		let line = '';
		let point = 0;

		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--line' && i + 1 < args.length) {
				line = args[i + 1];
			} else if (args[i] === '--point' && i + 1 < args.length) {
				point = parseInt(args[i + 1], 10);
			}
		}

		// If no --line flag, use all args as the line
		if (!line && args.length > 0) {
			line = args.join(' ');
			point = line.length;
		}

		const words = this.parseWords(line);
		const wordIndex = this.findWordIndexAtPoint(words, line, point);
		const currentWord = words[wordIndex] || '';
		const previousWord = wordIndex > 0 ? words[wordIndex - 1] : '';

		return {
			line,
			point,
			currentWord,
			previousWord,
			words,
			wordIndex,
			shell: 'fish',
		};
	}

	/**
	 * Parse a generic completion context for testing or custom scenarios
	 *
	 * @param line - The command line string
	 * @param point - Cursor position
	 * @returns Parsed completion context
	 */
	static parseGeneric(line: string, point: number): CompletionContext {
		const words = this.parseWords(line);
		const wordIndex = this.findWordIndexAtPoint(words, line, point);
		const currentWord = words[wordIndex] || '';
		const previousWord = wordIndex > 0 ? words[wordIndex - 1] : '';

		return {
			line,
			point,
			currentWord,
			previousWord,
			words,
			wordIndex,
		};
	}

	/**
	 * Parse command line into words, respecting quotes and escapes
	 *
	 * This handles:
	 * - Single quotes: 'hello world'
	 * - Double quotes: "hello world"
	 * - Escaped spaces: hello\ world
	 *
	 * @param line - The command line to parse
	 * @returns Array of words
	 */
	private static parseWords(line: string): string[] {
		const words: string[] = [];
		let currentWord = '';
		let inSingleQuote = false;
		let inDoubleQuote = false;
		let escaped = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];

			if (escaped) {
				currentWord += char;
				escaped = false;
				continue;
			}

			if (char === '\\') {
				escaped = true;
				continue;
			}

			if (char === "'" && !inDoubleQuote) {
				inSingleQuote = !inSingleQuote;
				continue;
			}

			if (char === '"' && !inSingleQuote) {
				inDoubleQuote = !inDoubleQuote;
				continue;
			}

			if (char === ' ' && !inSingleQuote && !inDoubleQuote) {
				if (currentWord.length > 0) {
					words.push(currentWord);
					currentWord = '';
				}
				continue;
			}

			currentWord += char;
		}

		// Push the last word if it exists
		if (currentWord.length > 0) {
			words.push(currentWord);
		}

		return words;
	}

	/**
	 * Find the word index at a specific cursor position
	 *
	 * @param words - Array of parsed words
	 * @param line - The full command line
	 * @param point - Cursor position (character index)
	 * @returns Index of the word at the cursor position
	 */
	private static findWordIndexAtPoint(words: string[], line: string, point: number): number {
		if (words.length === 0) {
			return 0;
		}

		let currentPos = 0;

		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			const wordStart = line.indexOf(word, currentPos);
			const wordEnd = wordStart + word.length;

			// Check if cursor is within this word or right after it
			if (point >= wordStart && point <= wordEnd) {
				return i;
			}

			// Check if cursor is in the space between this word and the next
			if (i < words.length - 1) {
				const nextWord = words[i + 1];
				const nextWordStart = line.indexOf(nextWord, wordEnd);
				if (point > wordEnd && point < nextWordStart) {
					// Cursor is in whitespace, but closer to next word
					// Return next word index
					return i + 1;
				}
			}

			currentPos = wordEnd;
		}

		// If cursor is after all words, return the last word index + 1
		return words.length;
	}
}
