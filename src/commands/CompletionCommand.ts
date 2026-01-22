import chalk from 'chalk';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { CompletionContextParser } from '@/src/completion/CompletionContextParser.js';
import { CompletionEngine } from '@/src/completion/CompletionEngine.js';
import { ShellConfigManager } from '@/src/completion/ShellConfigManager.js';
import { ShellScriptGenerator } from '@/src/completion/ShellScriptGenerator.js';
import { Shell } from '@/src/completion/types.js';

export type CompletionCommandOptions = {
	commandRegistry: CommandRegistry;
	cliName: string;
	cliPath: string;
};

/**
 * Built-in command for managing shell completion installation
 *
 * Subcommands:
 * - install [bash|zsh|fish] - Install completion (auto-detect shell if not specified)
 * - uninstall [bash|zsh|fish] - Uninstall completion
 * - suggest - Generate completion suggestions (called by shell scripts)
 */
export default class CompletionCommand extends Command {
	private readonly completionEngine: CompletionEngine;
	private readonly shellScriptGenerator: ShellScriptGenerator;
	private readonly cliName: string;
	private readonly cliPath: string;

	constructor(opts: CompletionCommandOptions) {
		super('completion', {
			description: 'Manage shell completion installation',
			group: 'completion',
		});

		this.completionEngine = this.newCompletionEngine(opts.commandRegistry);
		this.shellScriptGenerator = new ShellScriptGenerator(opts.cliName, opts.cliPath);
		this.cliName = opts.cliName;
		this.cliPath = opts.cliPath;
	}

	protected newCompletionEngine(commandRegistry: CommandRegistry): CompletionEngine {
		return new CompletionEngine(commandRegistry);
	}

	async handle(): Promise<number> {
		const args = this.parser.argument('_', []) as string[];
		const subcommand = args[0];

		if (!subcommand) {
			this.io.error('Please specify a subcommand: install, uninstall, or suggest\n');
			this.io.log('Usage:');
			this.io.log('  completion install [bash|zsh|fish]   Install completion (auto-detect shell if not specified)');
			this.io.log('  completion uninstall [bash|zsh|fish] Uninstall completion');
			this.io.log('  completion suggest                    Generate suggestions (internal use)');
			return 1;
		}

		switch (subcommand) {
			case 'install': {
				const shell = args[1] as Shell | undefined;
				return await this.handleInstall(shell);
			}

			case 'uninstall': {
				const shell = args[1] as Shell | undefined;
				return await this.handleUninstall(shell);
			}

			case 'suggest':
				return await this.handleSuggest();

			default:
				this.io.error(`Unknown subcommand: ${subcommand}\n`);
				return 1;
		}
	}

	/**
	 * Handle the install subcommand
	 */
	private async handleInstall(shell?: Shell): Promise<number> {
		try {
			// Detect shell if not specified
			if (!shell) {
				shell = ShellConfigManager.detectShell();
				if (!shell) {
					this.io.error('Could not detect your shell. Please specify explicitly: bash, zsh, or fish\n');
					return 1;
				}
				this.io.log(`Detected shell: ${chalk.cyan(shell)}\n`);
			}

			// Validate shell
			if (!['bash', 'zsh', 'fish'].includes(shell)) {
				this.io.error(`Unsupported shell: ${shell}. Supported shells: bash, zsh, fish\n`);
				return 1;
			}

			// Generate completion script
			this.io.log(`Generating ${shell} completion script...`);
			const script = this.shellScriptGenerator.generateScript(shell);

			// Determine script path
			const completionDir = path.join(os.homedir(), '.config', 'bob-completions');
			const scriptFileName = `${this.cliName}-completion.${shell === 'fish' ? 'fish' : 'sh'}`;
			const scriptPath = path.join(completionDir, scriptFileName);

			// Create completion directory if it doesn't exist
			if (!fs.existsSync(completionDir)) {
				fs.mkdirSync(completionDir, { recursive: true });
			}

			// Write script file
			await fs.promises.writeFile(scriptPath, script, 'utf-8');
			this.io.log(chalk.green(`✓ Completion script written to: ${scriptPath}\n`));

			// Install in shell config
			this.io.log('Installing completion in shell config...');
			await ShellConfigManager.install(shell, scriptPath, this.cliName);

			this.io.log(chalk.green('✓ Completion installed successfully!\n'));
			this.io.log('To enable completion in your current shell, run:');
			this.io.log(chalk.cyan(`  source ${ShellConfigManager.getConfigPath(shell)}\n`));
			this.io.log('Or simply restart your terminal.');

			return 0;
		} catch (error) {
			this.io.error(`Failed to install completion: ${error}\n`);
			return 1;
		}
	}

	/**
	 * Handle the uninstall subcommand
	 */
	private async handleUninstall(shell?: Shell): Promise<number> {
		try {
			// Detect shell if not specified
			if (!shell) {
				shell = ShellConfigManager.detectShell();
				if (!shell) {
					this.io.error('Could not detect your shell. Please specify explicitly: bash, zsh, or fish\n');
					return 1;
				}
			}

			// Validate shell
			if (!['bash', 'zsh', 'fish'].includes(shell)) {
				this.io.error(`Unsupported shell: ${shell}. Supported shells: bash, zsh, fish\n`);
				return 1;
			}

			this.io.log(`Uninstalling ${shell} completion...`);

			// Remove from shell config
			await ShellConfigManager.uninstall(shell, this.cliName);

			// Remove script file
			const completionDir = path.join(os.homedir(), '.config', 'bob-completions');
			const scriptFileName = `${this.cliName}-completion.${shell === 'fish' ? 'fish' : 'sh'}`;
			const scriptPath = path.join(completionDir, scriptFileName);

			if (fs.existsSync(scriptPath)) {
				await fs.promises.unlink(scriptPath);
				this.io.log(chalk.green(`✓ Removed completion script: ${scriptPath}\n`));
			}

			this.io.log(chalk.green('✓ Completion uninstalled successfully!\n'));
			this.io.log('Restart your terminal for changes to take effect.');

			return 0;
		} catch (error) {
			this.io.error(`Failed to uninstall completion: ${error}\n`);
			return 1;
		}
	}

	/**
	 * Handle the suggest subcommand (called by shell completion scripts)
	 */
	private async handleSuggest(): Promise<number> {
		try {
			// Parse completion context from environment variables
			const context = CompletionContextParser.parseBashContext(process.env);

			// Generate completions
			const result = this.completionEngine.generateCompletions(context);

			// Output suggestions (one per line for bash/zsh, space-separated for fish)
			if (context.shell === 'fish') {
				this.io.log(result.suggestions.join(' '));
			} else {
				this.io.log(result.suggestions.join('\n'));
			}

			return 0;
		} catch (error) {
			// Silent error handling for completion - don't show errors during tab completion
			// Errors would interrupt the user's shell experience
			return 1;
		}
	}
}
