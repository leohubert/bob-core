import { describe, expect, it } from 'vitest';

import { ShellScriptGenerator } from '@/src/completion/ShellScriptGenerator.js';

describe('ShellScriptGenerator', () => {
	const testCliName = 'test-cli';
	const testCliPath = '/usr/local/bin/test-cli';

	describe('generateScript', () => {
		it('should generate bash completion script', () => {
			const generator = new ShellScriptGenerator(testCliName, testCliPath);
			const script = generator.generateScript('bash');

			expect(script).toContain('#!/usr/bin/env bash');
			expect(script).toContain('_test-cli_completion');
			expect(script).toContain('/usr/local/bin/test-cli completion suggest');
			expect(script).toContain('complete -F _test-cli_completion test-cli');
			expect(script).toContain('COMP_LINE');
			expect(script).toContain('COMP_POINT');
		});

		it('should generate zsh completion script', () => {
			const generator = new ShellScriptGenerator(testCliName, testCliPath);
			const script = generator.generateScript('zsh');

			expect(script).toContain('#compdef test-cli');
			expect(script).toContain('_test-cli_completion');
			expect(script).toContain('/usr/local/bin/test-cli completion suggest');
			expect(script).toContain('compdef _test-cli_completion test-cli');
			expect(script).toContain('BUFFER');
			expect(script).toContain('CURSOR');
		});

		it('should generate fish completion script', () => {
			const generator = new ShellScriptGenerator(testCliName, testCliPath);
			const script = generator.generateScript('fish');

			expect(script).toContain('# Fish completion');
			expect(script).toContain('function __test-cli_complete');
			expect(script).toContain('/usr/local/bin/test-cli completion suggest');
			expect(script).toContain("complete -c test-cli -f -a '(__test-cli_complete)'");
			expect(script).toContain('commandline');
		});
	});

	describe('placeholder replacement', () => {
		it('should replace CLI_NAME placeholder', () => {
			const generator = new ShellScriptGenerator('my-custom-cli', testCliPath);
			const script = generator.generateScript('bash');

			expect(script).toContain('my-custom-cli');
			expect(script).toContain('_my-custom-cli_completion');
			expect(script).toContain('complete -F _my-custom-cli_completion my-custom-cli');
		});

		it('should replace CLI_PATH placeholder', () => {
			const generator = new ShellScriptGenerator(testCliName, '/custom/path/to/cli');
			const script = generator.generateScript('bash');

			expect(script).toContain('/custom/path/to/cli completion suggest');
		});

		it('should handle CLI names with special characters', () => {
			const generator = new ShellScriptGenerator('my_cli-tool', testCliPath);
			const script = generator.generateScript('bash');

			expect(script).toContain('_my_cli-tool_completion');
			expect(script).toContain('complete -F _my_cli-tool_completion my_cli-tool');
		});

		it('should handle paths with spaces', () => {
			const generator = new ShellScriptGenerator(testCliName, '/usr/local/my tools/test-cli');
			const script = generator.generateScript('bash');

			expect(script).toContain('/usr/local/my tools/test-cli completion suggest');
		});
	});

	describe('all shell types', () => {
		it('should generate scripts for all supported shells', () => {
			const generator = new ShellScriptGenerator(testCliName, testCliPath);

			const bashScript = generator.generateScript('bash');
			const zshScript = generator.generateScript('zsh');
			const fishScript = generator.generateScript('fish');

			expect(bashScript).toBeTruthy();
			expect(zshScript).toBeTruthy();
			expect(fishScript).toBeTruthy();

			// Each script should be unique
			expect(bashScript).not.toBe(zshScript);
			expect(bashScript).not.toBe(fishScript);
			expect(zshScript).not.toBe(fishScript);
		});

		it('should all invoke the completion suggest command', () => {
			const generator = new ShellScriptGenerator(testCliName, testCliPath);

			const bashScript = generator.generateScript('bash');
			const zshScript = generator.generateScript('zsh');
			const fishScript = generator.generateScript('fish');

			expect(bashScript).toContain('completion suggest');
			expect(zshScript).toContain('completion suggest');
			expect(fishScript).toContain('completion suggest');
		});
	});

	describe('script validity', () => {
		it('should generate non-empty scripts', () => {
			const generator = new ShellScriptGenerator(testCliName, testCliPath);

			expect(generator.generateScript('bash').length).toBeGreaterThan(100);
			expect(generator.generateScript('zsh').length).toBeGreaterThan(100);
			expect(generator.generateScript('fish').length).toBeGreaterThan(100);
		});

		it('should not contain placeholder markers in output', () => {
			const generator = new ShellScriptGenerator(testCliName, testCliPath);

			const bashScript = generator.generateScript('bash');
			const zshScript = generator.generateScript('zsh');
			const fishScript = generator.generateScript('fish');

			// Ensure no template placeholders remain
			expect(bashScript).not.toContain('{{CLI_NAME}}');
			expect(bashScript).not.toContain('{{CLI_PATH}}');

			expect(zshScript).not.toContain('{{CLI_NAME}}');
			expect(zshScript).not.toContain('{{CLI_PATH}}');

			expect(fishScript).not.toContain('{{CLI_NAME}}');
			expect(fishScript).not.toContain('{{CLI_PATH}}');
		});
	});
});
