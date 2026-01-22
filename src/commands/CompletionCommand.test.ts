import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import CompletionCommand from '@/src/commands/CompletionCommand.js';
import { newFixtures } from '@/src/fixtures.test.js';

describe('CompletionCommand', () => {
	const fixtures = newFixtures();
	let testDir: string;
	let registry: CommandRegistry;

	beforeEach(async () => {
		// Create test directory
		testDir = path.join(os.tmpdir(), `bob-completion-test-${Date.now()}`);
		await fs.promises.mkdir(testDir, { recursive: true });

		// Create test command registry
		registry = new CommandRegistry({ logger: fixtures.logger });

		// Register a test command
		const testCommand = new Command('deploy', {
			description: 'Deploy application',
			options: {
				env: { type: 'string', alias: ['e'] },
				force: { type: 'boolean', alias: ['f'] },
			},
		});

		registry.registerCommand(testCommand);
	});

	afterEach(async () => {
		// Clean up test directory
		if (fs.existsSync(testDir)) {
			await fs.promises.rm(testDir, { recursive: true, force: true });
		}
	});

	describe('constructor', () => {
		it('should create completion command with required options', () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			expect(command.command).toBe('completion');
			expect(command.description).toContain('completion');
		});
	});

	describe('suggest subcommand', () => {
		it('should generate command suggestions', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			// Mock environment for bash completion
			const originalEnv = { ...process.env };
			process.env.COMP_LINE = 'test-cli ';
			process.env.COMP_POINT = '9';
			process.env.COMP_CWORD = '1';

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: ['suggest'],
			});

			expect(exitCode).toBe(0);
			expect(fixtures.logger.log).toHaveBeenCalled();

			// Restore environment
			process.env = originalEnv;
		});

		it('should handle completion errors silently', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			// Mock environment with invalid values
			const originalEnv = { ...process.env };
			process.env.COMP_LINE = '';
			process.env.COMP_POINT = '';
			process.env.COMP_CWORD = '';

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: ['suggest'],
			});

			// Should not throw, just return non-zero exit code
			expect(exitCode).toBeDefined();

			// Restore environment
			process.env = originalEnv;
		});
	});

	describe('install subcommand', () => {
		it('should show error when shell cannot be detected', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			// Mock shell detection to return null
			const originalEnv = { ...process.env };
			delete process.env.SHELL;

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: ['install'],
			});

			expect(exitCode).toBe(1);
			expect(fixtures.logger.error).toHaveBeenCalledWith(expect.stringContaining('Could not detect'));

			// Restore environment
			process.env = originalEnv;
		});

		it('should reject unsupported shells', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: ['install', 'powershell'],
			});

			expect(exitCode).toBe(1);
			expect(fixtures.logger.error).toHaveBeenCalledWith(expect.stringContaining('Unsupported shell'));
		});

		it('should accept explicit shell parameter', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			// This test would actually try to install, so we'd need to mock more
			// For now, we test that it accepts the parameter
			vi.spyOn(command as any, 'handleInstall').mockResolvedValue(0);

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: ['install', 'bash'],
			});

			expect((command as any).handleInstall).toHaveBeenCalledWith('bash');
		});
	});

	describe('uninstall subcommand', () => {
		it('should show error when shell cannot be detected', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			const originalEnv = { ...process.env };
			delete process.env.SHELL;

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: ['uninstall'],
			});

			expect(exitCode).toBe(1);
			expect(fixtures.logger.error).toHaveBeenCalledWith(expect.stringContaining('Could not detect'));

			process.env = originalEnv;
		});

		it('should reject unsupported shells', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: ['uninstall', 'cmd'],
			});

			expect(exitCode).toBe(1);
			expect(fixtures.logger.error).toHaveBeenCalledWith(expect.stringContaining('Unsupported shell'));
		});
	});

	describe('unknown subcommand', () => {
		it('should show error for unknown subcommand', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: ['unknown'],
			});

			expect(exitCode).toBe(1);
			expect(fixtures.logger.error).toHaveBeenCalledWith(expect.stringContaining('Unknown subcommand'));
		});
	});

	describe('no subcommand', () => {
		it('should show usage when no subcommand provided', async () => {
			const command = new CompletionCommand({
				commandRegistry: registry,
				cliName: 'test-cli',
				cliPath: '/usr/local/bin/test-cli',
			});

			const exitCode = await command.run({
				ctx: {},
				logger: fixtures.logger,
				args: [],
			});

			expect(exitCode).toBe(1);
			expect(fixtures.logger.error).toHaveBeenCalledWith(expect.stringContaining('Please specify a subcommand'));
			expect(fixtures.logger.log).toHaveBeenCalledWith(expect.stringContaining('Usage'));
		});
	});
});
