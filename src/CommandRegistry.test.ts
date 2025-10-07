import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { Logger } from '@/src/Logger.js';

describe('CommandRegistry', () => {
	let registry: CommandRegistry;
	let mockLogger: Logger;

	beforeEach(() => {
		mockLogger = {
			log: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
			verbose: vi.fn(),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;

		registry = new CommandRegistry(mockLogger);
	});

	describe('Initialization', () => {
		it('should create registry with empty commands', () => {
			expect(registry.getAvailableCommands()).toEqual([]);
		});

		it('should create registry with logger', () => {
			expect(registry).toBeInstanceOf(CommandRegistry);
		});

		it('should create default logger if none provided', () => {
			const reg = new CommandRegistry();
			expect(reg).toBeInstanceOf(CommandRegistry);
		});
	});

	describe('Command registration', () => {
		it('should register a command', () => {
			const command = new Command('test-command');
			registry.registerCommand(command);

			expect(registry.getAvailableCommands()).toContain('test-command');
		});

		it('should throw error when registering command without name', () => {
			const command = new Command('');
			expect(() => registry.registerCommand(command)).toThrow('Command signature is invalid');
		});

		it('should throw error when registering duplicate command', () => {
			const command1 = new Command('test');
			const command2 = new Command('test');

			registry.registerCommand(command1);
			expect(() => registry.registerCommand(command2)).toThrow('Command test already registered');
		});

		it('should allow duplicate registration with force flag', () => {
			const command1 = new Command('test');
			const command2 = new Command('test');

			registry.registerCommand(command1);
			registry.registerCommand(command2, true);

			expect(registry.getAvailableCommands()).toContain('test');
		});

		it('should register multiple commands', () => {
			const cmd1 = new Command('cmd1');
			const cmd2 = new Command('cmd2');
			const cmd3 = new Command('cmd3');

			registry.registerCommand(cmd1);
			registry.registerCommand(cmd2);
			registry.registerCommand(cmd3);

			expect(registry.getAvailableCommands()).toEqual(['cmd1', 'cmd2', 'cmd3']);
		});
	});

	describe('Command retrieval', () => {
		it('should get all available command names', () => {
			const cmd1 = new Command('cmd1');
			const cmd2 = new Command('cmd2');

			registry.registerCommand(cmd1);
			registry.registerCommand(cmd2);

			expect(registry.getAvailableCommands()).toEqual(['cmd1', 'cmd2']);
		});

		it('should get all command instances', () => {
			const cmd1 = new Command('cmd1');
			const cmd2 = new Command('cmd2');

			registry.registerCommand(cmd1);
			registry.registerCommand(cmd2);

			const commands = registry.getCommands();
			expect(commands).toHaveLength(2);
			expect(commands).toContain(cmd1);
			expect(commands).toContain(cmd2);
		});
	});

	describe('Command execution', () => {
		it('should run command by name', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);
			const command = new Command('test').handler(handlerFn);

			registry.registerCommand(command);

			const result = await registry.runCommand({}, 'test', 'arg1', 'arg2');

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it('should run command by instance', async () => {
			const handlerFn = vi.fn().mockResolvedValue(42);
			const command = new Command('test').handler(handlerFn);

			const result = await registry.runCommand({}, command);

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(42);
		});

		it('should pass context to command', async () => {
			const ctx = { user: 'test' };
			const handlerFn = vi.fn().mockResolvedValue(0);
			const command = new Command('test').handler(handlerFn);

			registry.registerCommand(command);
			await registry.runCommand(ctx, 'test');

			expect(handlerFn).toHaveBeenCalledWith(ctx, expect.any(Object));
		});

		it('should pass arguments to command', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);
			const command = new Command('test').arguments({ file: 'string' }).handler(handlerFn);

			registry.registerCommand(command);
			await registry.runCommand({}, 'test', 'test.txt');

			expect(handlerFn).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					arguments: expect.objectContaining({ file: 'test.txt' }),
				}),
			);
		});
	});

	describe('Command not found handling', () => {
		it('should throw error when command not found and no suggestions', async () => {
			await expect(registry.runCommand({}, 'nonexistent')).rejects.toThrow();
		});
	});

	describe('Custom command resolver', () => {
		it('should use custom resolver for loading commands', () => {
			const customResolver = vi.fn().mockResolvedValue(new Command('custom'));
			registry.withCommandResolver(customResolver);

			expect(customResolver).not.toHaveBeenCalled();
		});
	});
});
