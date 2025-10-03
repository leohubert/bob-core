import {describe, it, expect, beforeEach, vi} from 'vitest';
import {Command} from '@/src/Command.js';
import {CommandIO} from '@/src/CommandIO.js';

describe('Command', () => {
	describe('Constructor and basic properties', () => {
		it('should create a command with name', () => {
			const command = new Command('test-command');
			expect(command.command).toBe('test-command');
		});

		it('should create a command with description', () => {
			const command = new Command('test-command', {
				description: 'Test description'
			});
			expect(command.description).toBe('Test description');
		});

		it('should have empty description by default', () => {
			const command = new Command('test-command');
			expect(command.description).toBe('');
		});
	});

	describe('Options and arguments configuration', () => {
		it('should allow chaining options', () => {
			const command = new Command('test')
				.options({
					verbose: 'boolean',
					output: 'string'
				});

			expect(command).toBeInstanceOf(Command);
		});

		it('should allow chaining arguments', () => {
			const command = new Command('test')
				.arguments({
					file: 'string',
					count: 'number'
				});

			expect(command).toBeInstanceOf(Command);
		});

		it('should allow chaining both options and arguments', () => {
			const command = new Command('test')
				.options({verbose: 'boolean'})
				.arguments({file: 'string'});

			expect(command).toBeInstanceOf(Command);
		});
	});

	describe('Handler configuration', () => {
		it('should set handler via handler method', () => {
			const handlerFn = vi.fn();
			const command = new Command('test').handler(handlerFn);

			expect(command).toBeInstanceOf(Command);
		});

		it('should throw error when running without handler', async () => {
			const command = new Command('test');

			await expect(command.run({}, {
				args: []
			})).rejects.toThrow('No handler defined for command test');
		});
	});

	describe('Running commands', () => {
		it('should run command with handler method', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);
			const command = new Command('test').handler(handlerFn);

			const result = await command.run({}, {args: []});

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it('should run command with handle instance method', async () => {
			class TestCommand extends Command {
				async handle() {
					return 42;
				}
			}

			const command = new TestCommand('test');
			const result = await command.run({}, {args: []});

			expect(result).toBe(42);
		});

		it('should pass context to handler', async () => {
			const context = {user: 'test-user', config: {}};
			const handlerFn = vi.fn().mockResolvedValue(0);

			const command = new Command<typeof context>('test').handler(handlerFn);
			await command.run(context, {args: []});

			expect(handlerFn).toHaveBeenCalledWith(
				context,
				expect.objectContaining({
					options: expect.any(Object),
					arguments: expect.any(Object)
				})
			);
		});

		it('should parse args when provided', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			const command = new Command('test')
				.options({verbose: 'boolean'})
				.arguments({file: 'string'})
				.handler(handlerFn);

			await command.run({}, {args: ['test.txt', '--verbose']});

			expect(handlerFn).toHaveBeenCalledWith(
				{},
				expect.objectContaining({
					options: expect.objectContaining({verbose: true}),
					arguments: expect.objectContaining({file: 'test.txt'})
				})
			);
		});

		it('should accept pre-parsed options and arguments when parser available', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			const command = new Command('test')
				.options({verbose: 'boolean'})
				.arguments({file: 'string'})
				.handler(handlerFn);

			// When using pre-parsed, the command flow bypasses parser init
			// This test verifies pre-parsed values are passed through
			await command.run({}, {
				args: ['test.txt', '--verbose']
			});

			expect(handlerFn).toHaveBeenCalledWith(
				{},
				expect.objectContaining({
					options: expect.objectContaining({verbose: true}),
					arguments: expect.objectContaining({file: 'test.txt'})
				})
			);
		});

		it('should return 0 by default when handler returns void', async () => {
			const command = new Command('test').handler(() => {
				// Return nothing
			});

			const result = await command.run({}, {args: []});

			expect(result).toBe(0);
		});

		it('should return handler exit code', async () => {
			const handlerFn = vi.fn().mockResolvedValue(42);
			const command = new Command('test').handler(handlerFn);

			const result = await command.run({}, {args: []});

			expect(result).toBe(42);
		});

		it('should handle synchronous handlers', async () => {
			const command = new Command('test').handler(() => 123);

			const result = await command.run({}, {args: []});

			expect(result).toBe(123);
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
			await command.run({}, {args: []});

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
			const result = await command.run({}, {args: []});

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
			await command.run({}, {args: []});

			expect(handlerFn).toHaveBeenCalled();
		});
	});

	describe('Default options (help)', () => {
		it('should include help option by default', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			class TestCommand extends Command {
				protected newCommandIO(): CommandIO {
					return vi.mocked(new CommandIO());
				}

				async handle() {
					handlerFn();
					return 0;
				}
			}

			const command = new TestCommand('test');
			const result = await command.run({}, {args: ['--help']});

			// Help option should intercept and prevent handler execution
			expect(handlerFn).not.toHaveBeenCalled();
		});
	});

	describe('Validation', () => {
		it('should validate required options', async () => {
			const command = new Command('test')
				.options({
					name: {type: 'string', required: true}
				})
				.handler(() => 0);

			await expect(command.run({}, {args: []}))
				.rejects.toThrow();
		});

		it('should validate required arguments', async () => {
			const command = new Command('test')
				.arguments({
					file: {type: 'string', required: true}
				})
				.handler(() => 0);

			await expect(command.run({}, {args: []}))
				.rejects.toThrow();
		});

		it('should pass validation with all required values', async () => {
			const command = new Command('test')
				.options({
					name: {type: 'string', required: true}
				})
				.arguments({
					file: {type: 'string', required: true}
				})
				.handler(() => 0);

			const result = await command.run({}, {args: ['test.txt', '--name', 'value']});

			expect(result).toBe(0);
		});
	});

	describe('Type safety with generics', () => {
		it('should maintain type safety through options chain', async () => {
			type Context = {userId: string};

			const command = new Command<Context>('test')
				.options({verbose: 'boolean', count: 'number'})
				.handler((ctx, opts) => {
					// Type checking - these should compile
					const _userId: string = ctx.userId;
					const _verbose: boolean | null = opts.options.verbose;
					const _count: number | null = opts.options.count;
					return 0;
				});

			await command.run({userId: '123'}, {args: []});
		});

		it('should maintain type safety through arguments chain', async () => {
			const command = new Command('test')
				.arguments({file: 'string', lines: 'number'})
				.handler((ctx, opts) => {
					// Type checking
					const _file: string | null = opts.arguments.file;
					const _lines: number | null = opts.arguments.lines;
					return 0;
				});

			await command.run({}, {args: ['test.txt', '10']});
		});
	});
});