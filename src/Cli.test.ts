import {describe, it, expect, vi} from 'vitest';
import {Cli} from '@/src/Cli.js';
import {Command} from '@/src/Command.js';
import {Logger} from '@/src/Logger.js';
import {setupMockedLogger} from '@/src/testFixtures.js';

describe('Cli', () => {
	setupMockedLogger();

	describe('Initialization', () => {
		it('should create CLI with default settings', () => {
			const cli = new Cli();

			expect(cli).toBeInstanceOf(Cli);
			expect(cli.logger).toBeInstanceOf(Logger);
		});

		it('should create CLI with custom logger', () => {
			const logger = new Logger({level: 'debug'});
			const cli = new Cli({logger});

			expect(cli.logger).toBe(logger);
		});

		it('should create CLI with logger options', () => {
			const cli = new Cli({loggerOptions: {level: 'debug'}});

			expect(cli.logger.getLevel()).toBe('debug');
		});

		it('should create CLI with context', () => {
			const ctx = {user: 'test', config: {}};
			const cli = new Cli({ctx});

			expect(cli).toBeInstanceOf(Cli);
		});

		it('should create CLI with name and version', () => {
			const cli = new Cli({
				name: 'Test CLI',
				version: '1.0.0'
			});

			expect(cli).toBeInstanceOf(Cli);
		});
	});

	describe('Command loading', () => {
		it('should load command from instance', async () => {
			const cli = new Cli();
			const command = new Command('test').handler(() => 0);

			await cli.withCommands(command);

			expect(cli.commandRegistry.getAvailableCommands()).toContain('test');
		});

		it('should load command from class', async () => {
			const cli = new Cli();

			class TestCommand extends Command {
				constructor() {
					super('test-class');
				}

				handle() {
					return 0;
				}
			}

			await cli.withCommands(TestCommand);

			expect(cli.commandRegistry.getAvailableCommands()).toContain('test-class');
		});

		it('should load multiple commands', async () => {
			const cli = new Cli();
			const cmd1 = new Command('cmd1').handler(() => 0);
			const cmd2 = new Command('cmd2').handler(() => 0);

			await cli.withCommands(cmd1, cmd2);

			expect(cli.commandRegistry.getAvailableCommands()).toContain('cmd1');
			expect(cli.commandRegistry.getAvailableCommands()).toContain('cmd2');
		});
	});

	describe('Command execution', () => {
		it('should run command by name', async () => {
			const cli = new Cli();
			const handlerFn = vi.fn().mockResolvedValue(0);
			const command = new Command('test').handler(handlerFn);

			await cli.withCommands(command);
			const result = await cli.runCommand('test');

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it('should run command by instance', async () => {
			const cli = new Cli();
			const handlerFn = vi.fn().mockResolvedValue(42);
			const command = new Command('test').handler(handlerFn);

			const result = await cli.runCommand(command);

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(42);
		});

		it('should pass context to command', async () => {
			const ctx = {user: 'test'};
			const cli = new Cli({ctx});
			const handlerFn = vi.fn().mockResolvedValue(0);
			const command = new Command<typeof ctx>('test').handler(handlerFn);

			await cli.withCommands(command);
			await cli.runCommand('test');

			expect(handlerFn).toHaveBeenCalledWith(
				ctx,
				expect.any(Object)
			);
		});

		it('should pass arguments to command', async () => {
			const cli = new Cli();
			const handlerFn = vi.fn().mockResolvedValue(0);
			const command = new Command('test')
				.arguments({file: 'string'})
				.handler(handlerFn);

			await cli.withCommands(command);
			await cli.runCommand('test', 'test.txt');

			expect(handlerFn).toHaveBeenCalledWith(
				undefined, // Context is undefined when not provided
				expect.objectContaining({
					arguments: expect.objectContaining({file: 'test.txt'})
				})
			);
		});

		it('should run help command when no command specified', async () => {
			const cli = new Cli();

			const result = await cli.runCommand(undefined);

			// Help command returns 0
			expect(result).toBe(0);
		});

		it('should run help command explicitly', async () => {
			const cli = new Cli();

			const result = await cli.runHelpCommand();

			expect(result).toBe(0);
		});
	});

	describe('Error handling', () => {
		it('should handle errors through exception handler', async () => {
			const cli = new Cli();
			const command = new Command('error-cmd').handler(() => {
				throw new Error('Test error');
			});

			await cli.withCommands(command);

			await expect(cli.runCommand('error-cmd')).rejects.toThrow('Test error');
		});
	});

	describe('Command resolver', () => {
		it('should allow setting custom command resolver', () => {
			const cli = new Cli();
			const resolver = vi.fn();

			cli.setCommandResolver(resolver);

			expect(resolver).not.toHaveBeenCalled();
		});
	});

	describe('Type safety', () => {
		it('should maintain context type through CLI', async () => {
			type AppContext = {userId: string; isAdmin: boolean};
			const ctx: AppContext = {userId: '123', isAdmin: true};

			const cli = new Cli<AppContext>({ctx});

			const command = new Command<AppContext>('test').handler((c) => {
				// Type checking
				const _userId: string = c.userId;
				const _isAdmin: boolean = c.isAdmin;
				return 0;
			});

			await cli.withCommands(command);
			await cli.runCommand('test');
		});
	});
});
