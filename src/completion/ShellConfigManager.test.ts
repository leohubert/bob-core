import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ShellConfigManager } from '@/src/completion/ShellConfigManager.js';

describe('ShellConfigManager', () => {
	let testDir: string;
	let testConfigPath: string;

	beforeEach(async () => {
		// Create a temporary directory for test configs
		testDir = path.join(os.tmpdir(), `bob-test-${Date.now()}`);
		await fs.promises.mkdir(testDir, { recursive: true });
	});

	afterEach(async () => {
		// Clean up test directory
		if (fs.existsSync(testDir)) {
			await fs.promises.rm(testDir, { recursive: true, force: true });
		}
	});

	describe('detectShell', () => {
		it('should detect bash shell', () => {
			const env = { SHELL: '/bin/bash' };
			expect(ShellConfigManager.detectShell(env)).toBe('bash');
		});

		it('should detect zsh shell', () => {
			const env = { SHELL: '/bin/zsh' };
			expect(ShellConfigManager.detectShell(env)).toBe('zsh');
		});

		it('should detect fish shell', () => {
			const env = { SHELL: '/usr/local/bin/fish' };
			expect(ShellConfigManager.detectShell(env)).toBe('fish');
		});

		it('should handle shell paths with version numbers', () => {
			const env = { SHELL: '/opt/homebrew/bin/bash-5.2' };
			expect(ShellConfigManager.detectShell(env)).toBe('bash');
		});

		it('should return null for unknown shells', () => {
			const env = { SHELL: '/bin/sh' };
			expect(ShellConfigManager.detectShell(env)).toBeNull();
		});

		it('should return null when SHELL is not set', () => {
			const env = {};
			expect(ShellConfigManager.detectShell(env)).toBeNull();
		});
	});

	describe('getConfigPath', () => {
		it('should return .bashrc for bash on Linux', () => {
			const originalPlatform = process.platform;
			Object.defineProperty(process, 'platform', { value: 'linux' });

			const configPath = ShellConfigManager.getConfigPath('bash');
			expect(configPath).toContain('.bashrc');

			Object.defineProperty(process, 'platform', { value: originalPlatform });
		});

		it('should return .bash_profile for bash on macOS', () => {
			const originalPlatform = process.platform;
			Object.defineProperty(process, 'platform', { value: 'darwin' });

			const configPath = ShellConfigManager.getConfigPath('bash');
			expect(configPath).toContain('.bash_profile');

			Object.defineProperty(process, 'platform', { value: originalPlatform });
		});

		it('should return .zshrc for zsh', () => {
			const configPath = ShellConfigManager.getConfigPath('zsh');
			expect(configPath).toContain('.zshrc');
			expect(configPath).toContain(os.homedir());
		});

		it('should return fish config path', () => {
			const configPath = ShellConfigManager.getConfigPath('fish');
			expect(configPath).toContain('.config/fish/config.fish');
			expect(configPath).toContain(os.homedir());
		});
	});

	describe('install and uninstall', () => {
		beforeEach(() => {
			testConfigPath = path.join(testDir, '.bashrc');
		});

		it('should install completion to config file', async () => {
			const scriptPath = '/path/to/completion.sh';
			const cliName = 'test-cli';

			// Mock getConfigPath to use our test path
			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			await ShellConfigManager.install('bash', scriptPath, cliName);

			const content = await fs.promises.readFile(testConfigPath, 'utf-8');
			expect(content).toContain('# BOB-COMPLETION-START: test-cli');
			expect(content).toContain('source /path/to/completion.sh');
			expect(content).toContain('# BOB-COMPLETION-END: test-cli');

			// Restore
			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});

		it('should be idempotent (not duplicate on multiple installs)', async () => {
			const scriptPath = '/path/to/completion.sh';
			const cliName = 'test-cli';

			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			await ShellConfigManager.install('bash', scriptPath, cliName);
			await ShellConfigManager.install('bash', scriptPath, cliName);
			await ShellConfigManager.install('bash', scriptPath, cliName);

			const content = await fs.promises.readFile(testConfigPath, 'utf-8');

			// Should only have one occurrence
			const occurrences = (content.match(/BOB-COMPLETION-START: test-cli/g) || []).length;
			expect(occurrences).toBe(1);

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});

		it('should uninstall completion from config file', async () => {
			const scriptPath = '/path/to/completion.sh';
			const cliName = 'test-cli';

			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			// Install first
			await ShellConfigManager.install('bash', scriptPath, cliName);
			expect(fs.existsSync(testConfigPath)).toBe(true);

			// Then uninstall
			await ShellConfigManager.uninstall('bash', cliName);

			const content = await fs.promises.readFile(testConfigPath, 'utf-8');
			expect(content).not.toContain('BOB-COMPLETION-START: test-cli');
			expect(content).not.toContain('source /path/to/completion.sh');
			expect(content).not.toContain('BOB-COMPLETION-END: test-cli');

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});

		it('should preserve other content in config file', async () => {
			const scriptPath = '/path/to/completion.sh';
			const cliName = 'test-cli';

			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			// Create config with existing content
			await fs.promises.writeFile(testConfigPath, 'export PATH=$PATH:/usr/local/bin\nalias ll="ls -la"\n', 'utf-8');

			await ShellConfigManager.install('bash', scriptPath, cliName);

			const content = await fs.promises.readFile(testConfigPath, 'utf-8');
			expect(content).toContain('export PATH=$PATH:/usr/local/bin');
			expect(content).toContain('alias ll="ls -la"');
			expect(content).toContain('BOB-COMPLETION-START: test-cli');

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});

		it('should create config directory if it does not exist (fish)', async () => {
			const fishConfigDir = path.join(testDir, '.config', 'fish');
			const fishConfigPath = path.join(fishConfigDir, 'config.fish');
			const scriptPath = '/path/to/completion.fish';
			const cliName = 'test-cli';

			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => fishConfigPath;

			expect(fs.existsSync(fishConfigDir)).toBe(false);

			await ShellConfigManager.install('fish', scriptPath, cliName);

			expect(fs.existsSync(fishConfigDir)).toBe(true);
			expect(fs.existsSync(fishConfigPath)).toBe(true);

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});

		it('should create backup before modifying config', async () => {
			const scriptPath = '/path/to/completion.sh';
			const cliName = 'test-cli';

			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			// Create initial config
			await fs.promises.writeFile(testConfigPath, 'export PATH=$PATH:/usr/local/bin\n', 'utf-8');

			await ShellConfigManager.install('bash', scriptPath, cliName);

			// Check that backup was created
			const files = await fs.promises.readdir(testDir);
			const backups = files.filter(f => f.startsWith('.bashrc.bob-backup-'));
			expect(backups.length).toBeGreaterThan(0);

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});
	});

	describe('isInstalled', () => {
		beforeEach(() => {
			testConfigPath = path.join(testDir, '.zshrc');
		});

		it('should return false when config does not exist', async () => {
			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			const installed = await ShellConfigManager.isInstalled('zsh', '/path/to/completion.sh', 'test-cli');
			expect(installed).toBe(false);

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});

		it('should return false when not installed', async () => {
			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			await fs.promises.writeFile(testConfigPath, 'export PATH=$PATH:/usr/local/bin\n', 'utf-8');

			const installed = await ShellConfigManager.isInstalled('zsh', '/path/to/completion.sh', 'test-cli');
			expect(installed).toBe(false);

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});

		it('should return true when installed', async () => {
			const scriptPath = '/path/to/completion.sh';
			const cliName = 'test-cli';

			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			await ShellConfigManager.install('zsh', scriptPath, cliName);

			const installed = await ShellConfigManager.isInstalled('zsh', scriptPath, cliName);
			expect(installed).toBe(true);

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});
	});

	describe('multiple CLIs', () => {
		beforeEach(() => {
			testConfigPath = path.join(testDir, '.bashrc');
		});

		it('should handle multiple CLI completions in the same config', async () => {
			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			await ShellConfigManager.install('bash', '/path/to/cli1-completion.sh', 'cli1');
			await ShellConfigManager.install('bash', '/path/to/cli2-completion.sh', 'cli2');

			const content = await fs.promises.readFile(testConfigPath, 'utf-8');
			expect(content).toContain('BOB-COMPLETION-START: cli1');
			expect(content).toContain('BOB-COMPLETION-START: cli2');
			expect(content).toContain('/path/to/cli1-completion.sh');
			expect(content).toContain('/path/to/cli2-completion.sh');

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});

		it('should uninstall only the specified CLI', async () => {
			const originalGetConfigPath = ShellConfigManager.getConfigPath;
			ShellConfigManager.getConfigPath = () => testConfigPath;

			await ShellConfigManager.install('bash', '/path/to/cli1-completion.sh', 'cli1');
			await ShellConfigManager.install('bash', '/path/to/cli2-completion.sh', 'cli2');

			await ShellConfigManager.uninstall('bash', 'cli1');

			const content = await fs.promises.readFile(testConfigPath, 'utf-8');
			expect(content).not.toContain('BOB-COMPLETION-START: cli1');
			expect(content).toContain('BOB-COMPLETION-START: cli2');
			expect(content).toContain('/path/to/cli2-completion.sh');

			ShellConfigManager.getConfigPath = originalGetConfigPath;
		});
	});
});
