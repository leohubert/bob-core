import {describe, it, expect, vi, beforeEach} from 'vitest';
import {Cli, CliOptions} from '@/src/Cli.js';
import {Command} from '@/src/Command.js';
import {Logger} from '@/src/Logger.js';
import {newFixtures, newTestLogger, TestLogger} from '@/src/testFixtures.js';
import { faker } from '@faker-js/faker';

describe('Cli', () => {
	let logger: TestLogger;
	let cli: Cli
	let cliOptions: CliOptions = {}

	beforeEach(() => {
		logger = newTestLogger();

		cliOptions = {
			name: 'Test CLI',
			version: '1.0.0',
			logger,
			ctx: {
				user: faker.internet.username(),
			},
		};

		cli = new Cli(cliOptions);
	});

	describe('Command loading', () => {
		it('should load command from instance', async () => {

			const command = new Command('test').handler(() => 0);

			await cli.withCommands(command);

			expect(cli.commandRegistry.getAvailableCommands()).toContain('test');
		});

		it('should load command from class', async () => {


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

			const cmd1 = new Command('cmd1').handler(() => 0);
			const cmd2 = new Command('cmd2').handler(() => 0);

			await cli.withCommands(cmd1, cmd2);

			expect(cli.commandRegistry.getAvailableCommands()).toContain('cmd1');
			expect(cli.commandRegistry.getAvailableCommands()).toContain('cmd2');
		});
	});

	describe('Command execution', () => {
		let command: Command;
		let handlerFn: ReturnType<typeof vi.fn>;
		let expectedResult: number;

		beforeEach(async () => {
			expectedResult = faker.number.int({min: 1, max: 100});
			handlerFn = vi.fn().mockResolvedValue(expectedResult);
			command = new Command('test').handler(handlerFn);

			await cli.withCommands(command);
		})


		it('should run command by name', async () => {
			const result = await cli.runCommand('test');

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(expectedResult);
		});

		it('should run command by instance', async () => {
			const result = await cli.runCommand(command);

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(expectedResult);
		});

		it('should pass context to command', async () => {
			const ctx = {user: 'test'};
			const cli = new Cli({ctx, logger});
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
			command.arguments({file: 'string'})

			await cli.runCommand('test', 'test.txt');

			expect(handlerFn).toHaveBeenCalledExactlyOnceWith(
				cliOptions.ctx,
				expect.objectContaining({
					arguments: expect.objectContaining({file: 'test.txt'})
				})
			);
		});

		it('should run help command when no command specified', async () => {
			const result = await cli.runCommand(undefined);

			// Help command returns 0
			expect(result).toBe(0);
			expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Test CLI'));
		});

		it('should run help command explicitly', async () => {
			const result = await cli.runHelpCommand();

			expect(result).toBe(0);
			expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Test CLI'));
		});

		it('should return error code for unknown command', async () => {
			const result = await cli.runCommand('unknown-cmd');

			expect(result).toBe(-1);
			expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('not found.'));
		})

		it('should handle errors through exception handler', async () => {
			command.handler(() => {
				throw new Error('Test error');
			});

			await expect(cli.runCommand(command.command)).rejects.toThrow('Test error');
		});

	});


	describe('Command resolver', () => {
		it('should allow setting custom command resolver', () => {

			const resolver = vi.fn();

			cli.setCommandResolver(resolver);

			expect(resolver).not.toHaveBeenCalled();
		});
	});

	describe('Type safety', () => {
		it('should maintain context type through CLI', async () => {
			type AppContext = { userId: string; isAdmin: boolean };
			const ctx: AppContext = {userId: '123', isAdmin: true};

			const cli = new Cli<AppContext>({ctx, logger});

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
