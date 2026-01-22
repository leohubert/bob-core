import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Shell } from '@/src/completion/types.js';

/**
 * Manages shell configuration files for completion installation
 */
export class ShellConfigManager {
	/**
	 * Detect the current shell from the SHELL environment variable
	 *
	 * @param env - Process environment (defaults to process.env)
	 * @returns The detected shell type, or null if not recognized
	 */
	static detectShell(env: NodeJS.ProcessEnv = process.env): Shell | null {
		const shellPath = env.SHELL || '';
		const shellName = path.basename(shellPath);

		if (shellName.includes('bash')) {
			return 'bash';
		} else if (shellName.includes('zsh')) {
			return 'zsh';
		} else if (shellName.includes('fish')) {
			return 'fish';
		}

		return null;
	}

	/**
	 * Get the config file path for the specified shell
	 *
	 * @param shell - The shell type
	 * @returns Absolute path to the shell config file
	 */
	static getConfigPath(shell: Shell): string {
		const homeDir = os.homedir();

		switch (shell) {
			case 'bash':
				// On macOS, bash uses .bash_profile, on Linux, .bashrc
				if (process.platform === 'darwin') {
					return path.join(homeDir, '.bash_profile');
				}
				return path.join(homeDir, '.bashrc');

			case 'zsh':
				return path.join(homeDir, '.zshrc');

			case 'fish':
				return path.join(homeDir, '.config', 'fish', 'config.fish');

			default:
				throw new Error(`Unsupported shell: ${shell}`);
		}
	}

	/**
	 * Install completion script reference in shell config
	 *
	 * @param shell - The shell type
	 * @param scriptPath - Absolute path to the completion script
	 * @param cliName - Name of the CLI (for marker comments)
	 * @returns Promise that resolves when installation is complete
	 */
	static async install(shell: Shell, scriptPath: string, cliName: string): Promise<void> {
		const configPath = this.getConfigPath(shell);

		// Create config directory if it doesn't exist (for fish)
		const configDir = path.dirname(configPath);
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir, { recursive: true });
		}

		// Check if already installed
		if (await this.isInstalled(shell, scriptPath, cliName)) {
			// Already installed, no need to do anything
			return;
		}

		// Create backup
		await this.backupConfig(configPath);

		// Generate source line
		const sourceLine = `source ${scriptPath}`;

		// Add completion to config
		await this.addSourceLine(configPath, sourceLine, cliName);
	}

	/**
	 * Uninstall completion script reference from shell config
	 *
	 * @param shell - The shell type
	 * @param cliName - Name of the CLI (for marker comments)
	 * @returns Promise that resolves when uninstallation is complete
	 */
	static async uninstall(shell: Shell, cliName: string): Promise<void> {
		const configPath = this.getConfigPath(shell);

		if (!fs.existsSync(configPath)) {
			// Config doesn't exist, nothing to uninstall
			return;
		}

		// Create backup
		await this.backupConfig(configPath);

		// Remove completion from config
		await this.removeSourceLine(configPath, cliName);
	}

	/**
	 * Check if completion is already installed
	 *
	 * @param shell - The shell type
	 * @param scriptPath - Path to the completion script
	 * @param cliName - Name of the CLI
	 * @returns Promise that resolves to true if installed, false otherwise
	 */
	static async isInstalled(shell: Shell, scriptPath: string, cliName: string): Promise<boolean> {
		const configPath = this.getConfigPath(shell);

		if (!fs.existsSync(configPath)) {
			return false;
		}

		const content = await fs.promises.readFile(configPath, 'utf-8');
		const startMarker = this.getStartMarker(cliName);

		return content.includes(startMarker);
	}

	/**
	 * Create a backup of the config file
	 *
	 * @param configPath - Path to the config file
	 * @returns Path to the backup file
	 */
	private static async backupConfig(configPath: string): Promise<string> {
		if (!fs.existsSync(configPath)) {
			// No config to backup
			return '';
		}

		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const backupPath = `${configPath}.bob-backup-${timestamp}`;

		await fs.promises.copyFile(configPath, backupPath);
		return backupPath;
	}

	/**
	 * Add source line to config file (idempotent)
	 *
	 * @param configPath - Path to the config file
	 * @param sourceLine - The source line to add
	 * @param cliName - Name of the CLI (for markers)
	 */
	private static async addSourceLine(configPath: string, sourceLine: string, cliName: string): Promise<void> {
		const startMarker = this.getStartMarker(cliName);
		const endMarker = this.getEndMarker(cliName);

		// Read existing content or create empty
		let content = '';
		if (fs.existsSync(configPath)) {
			content = await fs.promises.readFile(configPath, 'utf-8');
		}

		// Check if already present (idempotent)
		if (content.includes(startMarker)) {
			return;
		}

		// Add completion section
		const completionSection = `\n${startMarker}\n${sourceLine}\n${endMarker}\n`;

		// Append to config
		await fs.promises.appendFile(configPath, completionSection, 'utf-8');
	}

	/**
	 * Remove source line from config file
	 *
	 * @param configPath - Path to the config file
	 * @param cliName - Name of the CLI (for markers)
	 */
	private static async removeSourceLine(configPath: string, cliName: string): Promise<void> {
		const content = await fs.promises.readFile(configPath, 'utf-8');
		const startMarker = this.getStartMarker(cliName);
		const endMarker = this.getEndMarker(cliName);

		// Remove the section between markers (including the markers)
		const regex = new RegExp(`\n?${this.escapeRegex(startMarker)}[\\s\\S]*?${this.escapeRegex(endMarker)}\n?`, 'g');
		const newContent = content.replace(regex, '');

		await fs.promises.writeFile(configPath, newContent, 'utf-8');
	}

	/**
	 * Get the start marker comment for a CLI
	 */
	private static getStartMarker(cliName: string): string {
		return `# BOB-COMPLETION-START: ${cliName}`;
	}

	/**
	 * Get the end marker comment for a CLI
	 */
	private static getEndMarker(cliName: string): string {
		return `# BOB-COMPLETION-END: ${cliName}`;
	}

	/**
	 * Escape special regex characters in a string
	 */
	private static escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
