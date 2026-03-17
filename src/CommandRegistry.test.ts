import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { Logger } from '@/src/Logger.js';
import { Flags } from '@/src/flags/index.js';
import { ArgumentsSchema } from '@/src/lib/types.js';

function makeCommand(name: string, handler?: (...args: any[]) => any, aliases: string[] = []) {
	return class extends Command {
		static command = name;
		static aliases = aliases;
		async handle(...args: any[]) {
			return handler?.(...args) ?? 0;
		}
	};
}

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
		} as any;

		registry = new CommandRegistry({
			logger: mockLogger,
		});
	});

	describe('Initialization', () => {
		it('should create registry with empty commands', () => {
			expect(registry.getAvailableCommands()).toEqual([]);
		});

		it('should create registry with logger', () => {
			expect(registry).toBeInstanceOf(CommandRegistry);
		});

		it('should create default logger if none provided', () => {
			const reg = new CommandRegistry({});
			expect(reg).toBeInstanceOf(CommandRegistry);
		});
	});

	describe('Command registration', () => {
		it('should register a command', () => {
			registry.registerCommand(makeCommand('test-command'));

			expect(registry.getAvailableCommands()).toContain('test-command');
		});

		it('should throw error when registering command without name', () => {
			expect(() => registry.registerCommand(makeCommand(''))).toThrow('Cannot register a command with no name');
		});

		it('should throw error when registering duplicate command', () => {
			registry.registerCommand(makeCommand('test'));
			expect(() => registry.registerCommand(makeCommand('test'))).toThrow('Command test already registered');
		});

		it('should allow duplicate registration with force flag', () => {
			registry.registerCommand(makeCommand('test'));
			registry.registerCommand(makeCommand('test'), true);

			expect(registry.getAvailableCommands()).toContain('test');
		});

		it('should register multiple commands', () => {
			registry.registerCommand(makeCommand('cmd1'));
			registry.registerCommand(makeCommand('cmd2'));
			registry.registerCommand(makeCommand('cmd3'));

			expect(registry.getAvailableCommands()).toEqual(['cmd1', 'cmd2', 'cmd3']);
		});
	});

	describe('Command retrieval', () => {
		it('should get all available command names', () => {
			registry.registerCommand(makeCommand('cmd1'));
			registry.registerCommand(makeCommand('cmd2'));

			expect(registry.getAvailableCommands()).toEqual(['cmd1', 'cmd2']);
		});

		it('should get all command classes', () => {
			const Cmd1 = makeCommand('cmd1');
			const Cmd2 = makeCommand('cmd2');

			registry.registerCommand(Cmd1);
			registry.registerCommand(Cmd2);

			const commands = registry.getCommands();
			expect(commands).toHaveLength(2);
			expect(commands).toContain(Cmd1);
			expect(commands).toContain(Cmd2);
		});
	});

	describe('Command execution', () => {
		it('should run command by name', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			class TestCmd extends Command {
				static command = 'test';
				async handle(ctx: any, parsed: any) {
					return handlerFn(ctx, parsed);
				}
			}

			registry.registerCommand(TestCmd);

			const result = await registry.runCommand({}, 'test', 'arg1', 'arg2');

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it('should run command by instance', async () => {
			const handlerFn = vi.fn().mockResolvedValue(42);

			class TestCmd extends Command {
				static command = 'test';
				async handle(ctx: any, parsed: any) {
					return handlerFn(ctx, parsed);
				}
			}

			const command = new TestCmd();
			const result = await registry.runCommand({}, command);

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(42);
		});

		it('should pass context to command', async () => {
			const ctx = { user: 'test' };
			const handlerFn = vi.fn().mockResolvedValue(0);

			class TestCmd extends Command {
				static command = 'test';
				async handle(ctx: any, parsed: any) {
					return handlerFn(ctx, parsed);
				}
			}

			registry.registerCommand(TestCmd);
			await registry.runCommand(ctx, 'test');

			expect(handlerFn).toHaveBeenCalledWith(ctx, expect.any(Object));
		});

		it('should pass arguments to command', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			class TestCmd extends Command {
				static command = 'test';
				static args = { file: Flags.string() } satisfies ArgumentsSchema;
				async handle(ctx: any, parsed: any) {
					return handlerFn(ctx, parsed);
				}
			}

			registry.registerCommand(TestCmd);
			await registry.runCommand({}, 'test', 'test.txt');

			expect(handlerFn).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					args: expect.objectContaining({ file: 'test.txt' }),
				}),
			);
		});
	});

	describe('Command aliases', () => {
		it('should resolve command by alias', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);
			registry.registerCommand(makeCommand('deploy', handlerFn, ['d', 'dep']));

			await registry.runCommand({}, 'd');

			expect(handlerFn).toHaveBeenCalled();
		});

		it('should include aliases in getAvailableCommands', () => {
			registry.registerCommand(makeCommand('deploy', undefined, ['d', 'dep']));

			const available = registry.getAvailableCommands();
			expect(available).toContain('deploy');
			expect(available).toContain('d');
			expect(available).toContain('dep');
		});

		it('should not include duplicates in getCommands', () => {
			registry.registerCommand(makeCommand('deploy', undefined, ['d', 'dep']));

			const commands = registry.getCommands();
			expect(commands).toHaveLength(1);
		});

		it('should throw when alias conflicts with existing command name', () => {
			registry.registerCommand(makeCommand('d'));

			expect(() => registry.registerCommand(makeCommand('deploy', undefined, ['d']))).toThrow('Alias d conflicts with an existing command name.');
		});

		it('should throw when alias conflicts with another alias', () => {
			registry.registerCommand(makeCommand('deploy', undefined, ['d']));

			expect(() => registry.registerCommand(makeCommand('download', undefined, ['d']))).toThrow('Alias d already registered.');
		});

		it('should throw when command name conflicts with existing alias', () => {
			registry.registerCommand(makeCommand('deploy', undefined, ['d']));

			expect(() => registry.registerCommand(makeCommand('d'))).toThrow('Command name d conflicts with an existing alias.');
		});

		it('should bypass alias conflicts with force flag', () => {
			registry.registerCommand(makeCommand('deploy', undefined, ['d']));
			registry.registerCommand(makeCommand('download', undefined, ['d']), true);

			expect(registry.getAvailableCommands()).toContain('download');
		});
	});

	describe('Command not found handling', () => {
		it('should throw error when command not found and no suggestions', async () => {
			await expect(registry.runCommand({}, 'nonexistent')).rejects.toThrow();
		});
	});

	describe('Custom command resolver', () => {
		it('should use custom resolver for loading commands', () => {
			const customResolver = vi.fn().mockResolvedValue(makeCommand('custom'));
			registry.withCommandResolver(customResolver);

			expect(customResolver).not.toHaveBeenCalled();
		});
	});
});
