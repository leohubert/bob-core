import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cli, CliOptions } from '@/src/Cli.js';
import { Command } from '@/src/Command.js';
import { TestLogger, newTestLogger } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import { ArgsSchema } from '@/src/lib/types.js';

function makeCommand(name: string, handler?: (...args: any[]) => any) {
	return class extends Command {
		static command = name;
		async handle(...args: any[]) {
			return handler?.(...args) ?? 0;
		}
	};
}

describe('Cli', () => {
	let logger: TestLogger;
	let cli: Cli;
	let cliOptions: CliOptions = {};

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
			const command = new (makeCommand('test'))();

			await cli.withCommands(command);

			expect(cli.commandRegistry.getAvailableCommands()).toContain('test');
		});

		it('should load command from class', async () => {
			class TestCommand extends Command {
				static command = 'test-class';
				async handle() {
					return 0;
				}
			}

			await cli.withCommands(TestCommand);

			expect(cli.commandRegistry.getAvailableCommands()).toContain('test-class');
		});

		it('should load multiple commands', async () => {
			const cmd1 = new (makeCommand('cmd1'))();
			const cmd2 = new (makeCommand('cmd2'))();

			await cli.withCommands(cmd1, cmd2);

			expect(cli.commandRegistry.getAvailableCommands()).toContain('cmd1');
			expect(cli.commandRegistry.getAvailableCommands()).toContain('cmd2');
		});
	});

	describe('Command execution', () => {
		let handlerFn: ReturnType<typeof vi.fn<(...args: any[]) => any>>;
		let expectedResult: number;

		beforeEach(async () => {
			expectedResult = faker.number.int({ min: 1, max: 100 });
			handlerFn = vi.fn().mockResolvedValue(expectedResult);

			class TestCmd extends Command {
				static command = 'test';
				async handle(ctx: any, parsed: any) {
					return handlerFn(ctx, parsed);
				}
			}

			await cli.withCommands(new TestCmd());
		});

		it('should run command by name', async () => {
			const result = await cli.runCommand('test');

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(expectedResult);
		});

		it('should run command by instance', async () => {
			class TestCmd2 extends Command {
				static command = 'test2';
				async handle(ctx: any, parsed: any) {
					return handlerFn(ctx, parsed);
				}
			}
			const command = new TestCmd2();
			const result = await cli.runCommand(command);

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(expectedResult);
		});

		it('should pass context to command', async () => {
			const ctx = { user: 'test' };
			const cli = new Cli({ ctx, logger });
			const localHandlerFn = vi.fn().mockResolvedValue(0);

			class TestCmd extends Command {
				static command = 'test';
				async handle(ctx: any, parsed: any) {
					return localHandlerFn(ctx, parsed);
				}
			}

			await cli.withCommands(new TestCmd());
			await cli.runCommand('test');

			expect(localHandlerFn).toHaveBeenCalledWith(ctx, expect.any(Object));
		});

		it('should pass arguments to command', async () => {
			const localHandlerFn = vi.fn().mockResolvedValue(0);

			class TestCmdWithArgs extends Command {
				static command = 'test-args';
				static args = { file: Flags.string() } satisfies ArgsSchema;
				async handle(ctx: any, parsed: any) {
					return localHandlerFn(ctx, parsed);
				}
			}

			await cli.withCommands(new TestCmdWithArgs());
			await cli.runCommand('test-args', 'test.txt');

			expect(localHandlerFn).toHaveBeenCalledExactlyOnceWith(
				cliOptions.ctx,
				expect.objectContaining({
					args: expect.objectContaining({ file: 'test.txt' }),
				}),
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
			expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('not found'));
		});

		it('should handle errors through exception handler', async () => {
			class ErrorCmd extends Command {
				static command = 'error-test';
				async handle() {
					throw new Error('Test error');
				}
			}
			await cli.withCommands(new ErrorCmd());

			await expect(cli.runCommand('error-test')).rejects.toThrow('Test error');
		});
	});

	describe('Command aliases', () => {
		it('should run command by alias through cli.runCommand', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			class DeployCmd extends Command {
				static command = 'deploy';
				static aliases = ['d'];
				async handle() {
					return handlerFn();
				}
			}

			await cli.withCommands(new DeployCmd());
			const result = await cli.runCommand('d');

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(0);
		});
	});

	describe('Command resolver', () => {
		it('should pass through to the registry when a custom resolver is registered', () => {
			const resolver = vi.fn();
			const registrySpy = vi.spyOn(cli.commandRegistry, 'withCommandResolver');

			cli.withCommandResolver(resolver);

			expect(registrySpy).toHaveBeenCalledWith(resolver);
		});
	});

	describe('Type safety', () => {
		it('should maintain context type through CLI', async () => {
			type AppContext = { userId: string; isAdmin: boolean };
			const ctx: AppContext = { userId: '123', isAdmin: true };

			const cli = new Cli<AppContext>({ ctx, logger });

			class TestCmd extends Command<AppContext> {
				static command = 'test';
				async handle(ctx: AppContext) {
					// Type checking
					const _userId: string = ctx.userId;
					const _isAdmin: boolean = ctx.isAdmin;
					return 0;
				}
			}

			await cli.withCommands(new TestCmd());
			await cli.runCommand('test');
		});
	});
});
