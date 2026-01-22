import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Shell } from '@/src/completion/types.js';

/**
 * Generates shell-specific completion scripts from templates
 */
export class ShellScriptGenerator {
	private readonly cliName: string;
	private readonly cliPath: string;

	constructor(cliName: string, cliPath: string) {
		this.cliName = cliName;
		this.cliPath = cliPath;
	}

	/**
	 * Generate a completion script for the specified shell
	 *
	 * @param shell - The shell type (bash, zsh, or fish)
	 * @returns The generated completion script as a string
	 */
	generateScript(shell: Shell): string {
		const template = this.loadTemplate(shell);
		return this.replacePlaceholders(template);
	}

	/**
	 * Load the template file for the specified shell
	 *
	 * @param shell - The shell type
	 * @returns The template content as a string
	 */
	private loadTemplate(shell: Shell): string {
		const templateFileName = this.getTemplateFileName(shell);
		const templatePath = this.getTemplatePath(templateFileName);

		try {
			return fs.readFileSync(templatePath, 'utf-8');
		} catch (error) {
			throw new Error(`Failed to load completion template for ${shell}: ${error}`);
		}
	}

	/**
	 * Get the template file name for the specified shell
	 */
	private getTemplateFileName(shell: Shell): string {
		switch (shell) {
			case 'bash':
				return 'bash-completion.template.sh';
			case 'zsh':
				return 'zsh-completion.template.sh';
			case 'fish':
				return 'fish-completion.template.fish';
			default:
				throw new Error(`Unsupported shell: ${shell}`);
		}
	}

	/**
	 * Get the absolute path to the templates directory
	 */
	private getTemplatePath(fileName: string): string {
		// Get the directory of the current module
		const currentModulePath = fileURLToPath(import.meta.url);
		const currentDir = path.dirname(currentModulePath);

		// Templates are in the same directory as this file
		return path.join(currentDir, 'templates', fileName);
	}

	/**
	 * Replace placeholders in the template with actual values
	 *
	 * @param template - The template string
	 * @returns The template with placeholders replaced
	 */
	private replacePlaceholders(template: string): string {
		return template.replace(/\{\{CLI_NAME\}\}/g, this.cliName).replace(/\{\{CLI_PATH\}\}/g, this.cliPath);
	}
}
