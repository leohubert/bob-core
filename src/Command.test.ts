import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Command, CommandRunOption } from '@/src/Command.js';
import { TestLogger, newTestLogger } from '@/src/testFixtures.js';

describe('Command', () => {
	let logger: TestLogger;
	let command: Command;
	let commandRunOption: CommandRunOption<any, any, any>;

	beforeEach(() => {
		logger = newTestLogger();

		command = new Command('test-command', {
			description: 'A test command',
		});
		commandRunOption = {
			ctx: {},
			logger: logger,
			args: [],
		};
	});

	it('should instantiate Command', () => {
		expect(command).toBeInstanceOf(Command);
		expect(command).toHaveProperty('command', 'test-command');
		expect(command).toHaveProperty('description', 'A test command');
	});

	it('should throw error when running without handler', async () => {
		await expect(command.run(commandRunOption)).rejects.toThrow('No handler defined for command test');
	});

	describe('Running commands', () => {
		let handlerFn: ReturnType<typeof vi.fn>;
		let handlerResult: number | void;

		beforeEach(() => {
			handlerResult = faker.number.int({ min: 0, max: 100 });
			handlerFn = vi.fn().mockImplementation(() => handlerResult);
			command = command.handler(handlerFn);
		});

		it('should run command with handler method', async () => {
			const result = await command.run(commandRunOption);

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(handlerResult);
		});

		it('should run command with handle instance method', async () => {
			class TestCommand extends Command {
				async handle() {
					return 42;
				}
			}

			const command = new TestCommand('test');
			const result = await command.run(commandRunOption);

			expect(result).toBe(42);
			expect(handlerFn).not.toHaveBeenCalled();
		});

		it('should pass context to handler', async () => {
			const context = { user: 'test-user', config: {} };

			await command.run({
				ctx: context,
				logger,
				args: [],
			});

			expect(handlerFn).toHaveBeenCalledWith(
				context,
				expect.objectContaining({
					options: expect.any(Object),
					arguments: expect.any(Object),
				}),
			);
		});

		it('should parse args when provided', async () => {
			command = command.options<{}>({ verbose: 'boolean' }).arguments<{}>({ file: 'string' });
			commandRunOption = {
				...commandRunOption,
				args: ['test.txt', '--verbose'],
			};

			await command.run(commandRunOption);

			expect(handlerFn).toHaveBeenCalledWith(
				commandRunOption.ctx,
				expect.objectContaining({
					options: expect.objectContaining({ verbose: true }),
					arguments: expect.objectContaining({ file: 'test.txt' }),
				}),
			);
		});

		it('should accept pre-parsed options and arguments when parser available', async () => {
			command = command.options<{}>({ verbose: 'boolean' }).arguments<{}>({ file: 'string' });

			// When using pre-parsed, the command flow bypasses parser init
			// This test verifies pre-parsed values are passed through
			await command.run({
				ctx: commandRunOption.ctx,
				logger: commandRunOption.logger,
				options: { verbose: true },
				arguments: { file: 'test.txt' },
			});

			expect(handlerFn).toHaveBeenCalledWith(
				commandRunOption.ctx,
				expect.objectContaining({
					options: expect.objectContaining({ verbose: true }),
					arguments: expect.objectContaining({ file: 'test.txt' }),
				}),
			);
		});

		it('should return 0 by default when handler returns void', async () => {
			command = command.handler(() => {
				// No return value
			});

			const result = await command.run(commandRunOption);

			expect(result).toBe(0);
		});

		it('should handle asynchronous handlers', async () => {
			handlerFn.mockResolvedValue(handlerResult);

			const result = await command.run(commandRunOption);

			expect(result).toBe(handlerResult);
		});

		it('should include help option by default', async () => {
			commandRunOption = {
				...commandRunOption,
				args: ['--help'],
			};

			const result = await command.run(commandRunOption);

			expect(handlerFn).not.toHaveBeenCalled();
			expect(result).toBe(-1);
		});
	});

	describe('PreHandle hook', () => {
		it('should call preHandle before handler', async () => {
			const calls: string[] = [];

			class TestCommand extends Command {
				async preHandle() {
					calls.push('preHandle');
				}

				async handle() {
					calls.push('handle');
					return 0;
				}
			}

			const command = new TestCommand('test');
			await command.run(commandRunOption);

			expect(calls).toEqual(['preHandle', 'handle']);
		});

		it('should skip handler if preHandle returns non-zero', async () => {
			const handlerFn = vi.fn();

			class TestCommand extends Command {
				async preHandle() {
					return 5;
				}

				async handle() {
					handlerFn();
					return 0;
				}
			}

			const command = new TestCommand('test');
			const result = await command.run(commandRunOption);

			expect(result).toBe(5);
			expect(handlerFn).not.toHaveBeenCalled();
		});

		it('should continue to handler if preHandle returns 0', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			class TestCommand extends Command {
				async preHandle() {
					return 0;
				}

				async handle() {
					handlerFn();
					return 0;
				}
			}

			const command = new TestCommand('test');
			await command.run(commandRunOption);

			expect(handlerFn).toHaveBeenCalled();
		});
	});

	describe('Validation', () => {
		it('should validate required options', async () => {
			const command = new Command('test')
				.options({
					name: { type: 'string', required: true },
				})
				.handler(() => 0);

			await expect(command.run(commandRunOption)).rejects.toThrow();
		});

		it('should validate required arguments', async () => {
			const command = new Command('test')
				.disablePrompting()
				.arguments({
					file: { type: 'string', required: true },
				})
				.handler(() => 0);

			await expect(command.run(commandRunOption)).rejects.toThrow();
		});

		it('should pass validation with all required values', async () => {
			const command = new Command('test')
				.options({
					name: { type: 'string', required: true },
				})
				.arguments({
					file: { type: 'string', required: true },
				})
				.handler(() => 0);

			commandRunOption = {
				...commandRunOption,
				args: ['test.txt', '--name', 'value'],
			};

			const result = await command.run(commandRunOption);

			expect(result).toBe(0);
		});
	});

	describe('Type safety with generics', () => {
		it('should maintain type safety through options chain', async () => {
			type Context = { userId: string };

			const command = new Command<Context>('test').options({ verbose: 'boolean', count: 'number' }).handler((ctx, opts) => {
				// Type checking - these should compile
				const _userId: string = ctx.userId;
				const _verbose: boolean | null = opts.options.verbose;
				const _count: number | null = opts.options.count;
				return 0;
			});

			commandRunOption.ctx = { userId: '123' };

			await command.run(commandRunOption);

			expect(commandRunOption.ctx).toHaveProperty('userId', '123');
		});

		it('should maintain type safety through arguments chain', async () => {
			const command = new Command('test').arguments({ file: 'string', lines: 'number' }).handler((ctx, opts) => {
				// Type checking
				const _file: string | null = opts.arguments.file;
				const _lines: number | null = opts.arguments.lines;
				return 0;
			});

			commandRunOption = {
				...commandRunOption,
				args: ['test.txt', '10'],
			};

			await command.run(commandRunOption);
		});
	});
});
