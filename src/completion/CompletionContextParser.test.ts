import { describe, expect, it } from 'vitest';

import { CompletionContextParser } from '@/src/completion/CompletionContextParser.js';

describe('CompletionContextParser', () => {
	describe('parseBashContext', () => {
		it('should parse basic bash completion environment', () => {
			const env = {
				COMP_LINE: 'my-cli deploy --env prod',
				COMP_POINT: '25',
				COMP_CWORD: '3',
			};

			const context = CompletionContextParser.parseBashContext(env);

			expect(context.line).toBe('my-cli deploy --env prod');
			expect(context.point).toBe(25);
			expect(context.wordIndex).toBe(3);
			expect(context.words).toEqual(['my-cli', 'deploy', '--env', 'prod']);
			expect(context.currentWord).toBe('prod');
			expect(context.previousWord).toBe('--env');
			expect(context.shell).toBe('bash');
		});

		it('should handle completion at command name', () => {
			const env = {
				COMP_LINE: 'my-cli ',
				COMP_POINT: '7',
				COMP_CWORD: '1',
			};

			const context = CompletionContextParser.parseBashContext(env);

			expect(context.words).toEqual(['my-cli']);
			expect(context.wordIndex).toBe(1);
			expect(context.currentWord).toBe('');
			expect(context.previousWord).toBe('my-cli');
		});

		it('should handle empty line', () => {
			const env = {
				COMP_LINE: '',
				COMP_POINT: '0',
				COMP_CWORD: '0',
			};

			const context = CompletionContextParser.parseBashContext(env);

			expect(context.words).toEqual([]);
			expect(context.currentWord).toBe('');
			expect(context.previousWord).toBe('');
		});

		it('should handle zsh shell type', () => {
			const env = {
				COMP_LINE: 'my-cli help',
				COMP_POINT: '11',
				COMP_CWORD: '1',
			};

			const context = CompletionContextParser.parseBashContext(env, 'zsh');

			expect(context.shell).toBe('zsh');
		});
	});

	describe('parseFishContext', () => {
		it('should parse fish arguments with --line and --point', () => {
			const args = ['--line', 'my-cli deploy --env prod', '--point', '25'];

			const context = CompletionContextParser.parseFishContext(args);

			expect(context.line).toBe('my-cli deploy --env prod');
			expect(context.point).toBe(25);
			expect(context.words).toEqual(['my-cli', 'deploy', '--env', 'prod']);
			expect(context.shell).toBe('fish');
		});

		it('should handle args without flags', () => {
			const args = ['my-cli', 'deploy'];

			const context = CompletionContextParser.parseFishContext(args);

			expect(context.line).toBe('my-cli deploy');
			// The length is 13 (not 14) because 'my-cli deploy' has 13 characters
			expect(context.point).toBe(13);
			expect(context.words).toEqual(['my-cli', 'deploy']);
		});

		it('should handle empty args', () => {
			const args: string[] = [];

			const context = CompletionContextParser.parseFishContext(args);

			expect(context.line).toBe('');
			expect(context.words).toEqual([]);
		});
	});

	describe('parseGeneric', () => {
		it('should parse a simple command line', () => {
			// With cursor at position 14, which is after 'deploy' (length 13), we're past all words
			const context = CompletionContextParser.parseGeneric('my-cli deploy', 13);

			expect(context.line).toBe('my-cli deploy');
			expect(context.point).toBe(13);
			expect(context.words).toEqual(['my-cli', 'deploy']);
			expect(context.currentWord).toBe('deploy');
			expect(context.previousWord).toBe('my-cli');
		});

		it('should handle cursor in middle of word', () => {
			const context = CompletionContextParser.parseGeneric('my-cli deploy', 10);

			expect(context.currentWord).toBe('deploy');
			expect(context.wordIndex).toBe(1);
		});

		it('should handle cursor at start of line', () => {
			const context = CompletionContextParser.parseGeneric('my-cli deploy', 0);

			expect(context.currentWord).toBe('my-cli');
			expect(context.wordIndex).toBe(0);
		});

		it('should handle cursor after all words', () => {
			const context = CompletionContextParser.parseGeneric('my-cli deploy ', 14);

			expect(context.wordIndex).toBe(2);
			expect(context.currentWord).toBe('');
		});
	});

	describe('parseWords', () => {
		it('should parse words with single quotes', () => {
			const context = CompletionContextParser.parseGeneric("my-cli 'hello world' test", 25);

			expect(context.words).toEqual(['my-cli', 'hello world', 'test']);
		});

		it('should parse words with double quotes', () => {
			const context = CompletionContextParser.parseGeneric('my-cli "hello world" test', 25);

			expect(context.words).toEqual(['my-cli', 'hello world', 'test']);
		});

		it('should parse words with escaped spaces', () => {
			const context = CompletionContextParser.parseGeneric('my-cli hello\\ world test', 25);

			expect(context.words).toEqual(['my-cli', 'hello world', 'test']);
		});

		it('should handle mixed quoting styles', () => {
			const context = CompletionContextParser.parseGeneric('my-cli "foo bar" \'baz qux\' test', 32);

			expect(context.words).toEqual(['my-cli', 'foo bar', 'baz qux', 'test']);
		});

		it('should handle multiple spaces between words', () => {
			const context = CompletionContextParser.parseGeneric('my-cli   deploy    --env', 25);

			expect(context.words).toEqual(['my-cli', 'deploy', '--env']);
		});

		it('should handle options with values', () => {
			const context = CompletionContextParser.parseGeneric('my-cli deploy --env=prod', 24);

			expect(context.words).toEqual(['my-cli', 'deploy', '--env=prod']);
		});
	});

	describe('word index detection', () => {
		it('should detect word index at beginning of first word', () => {
			const context = CompletionContextParser.parseGeneric('my-cli deploy', 0);
			expect(context.wordIndex).toBe(0);
			expect(context.currentWord).toBe('my-cli');
		});

		it('should detect word index in middle of word', () => {
			const context = CompletionContextParser.parseGeneric('my-cli deploy', 5);
			expect(context.wordIndex).toBe(0);
			expect(context.currentWord).toBe('my-cli');
		});

		it('should detect word index at space after word', () => {
			const context = CompletionContextParser.parseGeneric('my-cli deploy', 7);
			expect(context.wordIndex).toBe(1);
			expect(context.currentWord).toBe('deploy');
		});

		it('should detect word index after all words', () => {
			const context = CompletionContextParser.parseGeneric('my-cli deploy ', 14);
			expect(context.wordIndex).toBe(2);
			expect(context.currentWord).toBe('');
		});

		it('should handle cursor at end of word', () => {
			const context = CompletionContextParser.parseGeneric('my-cli', 6);
			expect(context.wordIndex).toBe(0);
			expect(context.currentWord).toBe('my-cli');
		});
	});
});
