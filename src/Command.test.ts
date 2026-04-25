import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Command, CommandRunOption } from '@/src/Command.js';
import { Args } from '@/src/args/index.js';
import { TooManyArguments } from '@/src/errors/TooManyArguments.js';
import { TestLogger, newTestLogger } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import { ArgsSchema, FlagsSchema, Parsed } from '@/src/lib/types.js';

describe('Command', () => {
	let logger: TestLogger;
	let commandRunOption: CommandRunOption;

	beforeEach(() => {
		logger = newTestLogger();

		commandRunOption = {
			ctx: {},
			logger: logger,
			args: [],
		};
	});

	it('should instantiate Command', () => {
		class TestCmd extends Command {
			static command = 'test-command';
			static description = 'A test command';
			async handle() {
				return 0;
			}
		}

		const command = new TestCmd();
		expect(command).toBeInstanceOf(Command);
		expect(TestCmd.command).toBe('test-command');
		expect(TestCmd.description).toBe('A test command');
	});

	describe('Running commands', () => {
		let handlerFn: ReturnType<typeof vi.fn<(...args: any[]) => any>>;
		let handlerResult: number | void;

		beforeEach(() => {
			handlerResult = faker.number.int({ min: 0, max: 100 });
			handlerFn = vi.fn().mockReturnValue(handlerResult);
		});

		it('should run command with handle method', async () => {
			class TestCmd extends Command {
				static command = 'test';
				async handle() {
					return handlerFn();
				}
			}

			const command = new TestCmd();
			const result = await command.run(commandRunOption);

			expect(handlerFn).toHaveBeenCalled();
			expect(result).toBe(handlerResult);
		});

		it('should pass context to handler', async () => {
			const context = { user: 'test-user', config: {} };

			class TestCmd extends Command {
				static command = 'test';
				async handle(ctx: any, parsed: any) {
					handlerFn(ctx, parsed);
					return 0;
				}
			}

			const command = new TestCmd();
			await command.run({
				ctx: context,
				logger,
				args: [],
			});

			expect(handlerFn).toHaveBeenCalledWith(
				context,
				expect.objectContaining({
					flags: expect.any(Object),
					args: expect.any(Object),
				}),
			);
		});

		it('should parse args when provided', async () => {
			class TestCmd extends Command {
				static command = 'test';
				static flags = { verbose: Flags.boolean() } satisfies FlagsSchema;
				static args = { file: Args.string() } satisfies ArgsSchema;
				async handle(ctx: any, parsed: any) {
					handlerFn(ctx, parsed);
					return 0;
				}
			}

			const command = new TestCmd();
			await command.run({
				...commandRunOption,
				args: ['test.txt', '--verbose'],
			});

			expect(handlerFn).toHaveBeenCalledWith(
				commandRunOption.ctx,
				expect.objectContaining({
					flags: expect.objectContaining({ verbose: true }),
					args: expect.objectContaining({ file: 'test.txt' }),
				}),
			);
		});

		it('should accept pre-parsed options and arguments', async () => {
			class TestCmd extends Command {
				static command = 'test';
				static flags = { verbose: Flags.boolean() } satisfies FlagsSchema;
				static args = { file: Args.string() } satisfies ArgsSchema;
				async handle(ctx: any, parsed: any) {
					handlerFn(ctx, parsed);
					return 0;
				}
			}

			const command = new TestCmd();
			await command.run({
				ctx: commandRunOption.ctx,
				logger: commandRunOption.logger,
				flags: { verbose: true },
				args: { file: 'test.txt' },
			});

			expect(handlerFn).toHaveBeenCalledWith(
				commandRunOption.ctx,
				expect.objectContaining({
					flags: expect.objectContaining({ verbose: true }),
					args: expect.objectContaining({ file: 'test.txt' }),
				}),
			);
		});

		it('should return 0 by default when handler returns void', async () => {
			class TestCmd extends Command {
				static command = 'test';
				async handle() {
					// No return value
				}
			}

			const command = new TestCmd();
			const result = await command.run(commandRunOption);

			expect(result).toBe(0);
		});

		it('should handle asynchronous handlers', async () => {
			class TestCmd extends Command {
				static command = 'test';
				async handle() {
					return handlerResult;
				}
			}

			const command = new TestCmd();
			const result = await command.run(commandRunOption);

			expect(result).toBe(handlerResult);
		});

		it('should include help option by default', async () => {
			class TestCmd extends Command {
				static command = 'test';
				async handle() {
					handlerFn();
					return 0;
				}
			}

			const command = new TestCmd();
			const result = await command.run({
				...commandRunOption,
				args: ['--help'],
			});

			expect(handlerFn).not.toHaveBeenCalled();
			expect(result).toBe(-1);
		});
	});

	describe('PreHandle hook', () => {
		it('should call preHandle before handler', async () => {
			const calls: string[] = [];

			class TestCmd extends Command {
				static command = 'test';
				async preHandle() {
					calls.push('preHandle');
				}
				async handle() {
					calls.push('handle');
					return 0;
				}
			}

			const command = new TestCmd();
			await command.run(commandRunOption);

			expect(calls).toEqual(['preHandle', 'handle']);
		});

		it('should skip handler if preHandle returns non-zero', async () => {
			const handlerFn = vi.fn();

			class TestCmd extends Command {
				static command = 'test';
				async preHandle() {
					return 5;
				}
				async handle() {
					handlerFn();
					return 0;
				}
			}

			const command = new TestCmd();
			const result = await command.run(commandRunOption);

			expect(result).toBe(5);
			expect(handlerFn).not.toHaveBeenCalled();
		});

		it('should continue to handler if preHandle returns 0', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			class TestCmd extends Command {
				static command = 'test';
				async preHandle() {
					return 0;
				}
				async handle() {
					handlerFn();
					return 0;
				}
			}

			const command = new TestCmd();
			await command.run(commandRunOption);

			expect(handlerFn).toHaveBeenCalled();
		});
	});

	describe('Validation', () => {
		it('should validate required options', async () => {
			class TestCmd extends Command {
				static command = 'test';
				static disablePrompting = true;
				static flags = { name: Flags.string({ required: true }) } satisfies FlagsSchema;
				async handle() {
					return 0;
				}
			}

			const command = new TestCmd();
			await expect(command.run({ ...commandRunOption, args: [] })).rejects.toThrow();
		});

		it('should validate required arguments', async () => {
			class TestCmd extends Command {
				static command = 'test';
				static disablePrompting = true;
				static args = { file: Args.string({ required: true }) } satisfies ArgsSchema;
				async handle() {
					return 0;
				}
			}

			const command = new TestCmd();
			await expect(command.run({ ...commandRunOption, args: [] })).rejects.toThrow();
		});

		it('should pass validation with all required values', async () => {
			class TestCmd extends Command {
				static command = 'test';
				static flags = { name: Flags.string({ required: true }) } satisfies FlagsSchema;
				static args = { file: Args.string({ required: true }) } satisfies ArgsSchema;
				async handle() {
					return 0;
				}
			}

			const command = new TestCmd();
			const result = await command.run({
				...commandRunOption,
				args: ['test.txt', '--name', 'value'],
			});

			expect(result).toBe(0);
		});
	});

	describe('Hidden flag', () => {
		it('should not be hidden by default', () => {
			class TestCmd extends Command {
				static command = 'test';
				async handle() {
					return 0;
				}
			}
			expect(TestCmd.hidden).toBe(false);
		});

		it('should be hidden when static hidden is true', () => {
			class TestCmd extends Command {
				static command = 'test';
				static hidden = true;
				async handle() {
					return 0;
				}
			}
			expect(TestCmd.hidden).toBe(true);
		});
	});

	describe('Aliases', () => {
		it('should default to empty array', () => {
			class TestCmd extends Command {
				static command = 'test';
				async handle() {
					return 0;
				}
			}
			expect(TestCmd.aliases).toEqual([]);
		});

		it('should allow defining aliases on a command', () => {
			class TestCmd extends Command {
				static command = 'deploy';
				static aliases = ['d', 'dep'];
				async handle() {
					return 0;
				}
			}
			expect(TestCmd.aliases).toEqual(['d', 'dep']);
		});
	});

	describe('Disable default options', () => {
		it('should not include help option when default options are disabled', async () => {
			const handlerFn = vi.fn().mockReturnValue(0);

			class TestCmd extends Command {
				static command = 'test';
				static disableDefaultOptions = true;
				static allowUnknownFlags = true;
				async handle() {
					return handlerFn();
				}
			}

			const command = new TestCmd();
			const result = await command.run({
				...commandRunOption,
				args: ['--help'],
			});

			// With default options disabled, --help is not recognized as a special option
			// and the handler should be called instead
			expect(result).not.toBe(-1);
		});

		it('should still work with custom options when default options are disabled', async () => {
			const handlerFn = vi.fn().mockReturnValue(0);

			class TestCmd extends Command {
				static command = 'test';
				static disableDefaultOptions = true;
				static allowUnknownFlags = true;
				static flags = { verbose: Flags.boolean() } satisfies FlagsSchema;
				async handle(ctx: any, parsed: any) {
					return handlerFn(ctx, parsed);
				}
			}

			const command = new TestCmd();
			await command.run({
				...commandRunOption,
				args: ['--verbose'],
			});

			expect(handlerFn).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					flags: expect.objectContaining({ verbose: true }),
				}),
			);
		});
	});

	describe('Strict mode', () => {
		it('should reject extra positional arguments', async () => {
			class TestCmd extends Command {
				static command = 'test';
				static strictMode = true;
				static args = { file: Args.string() } satisfies ArgsSchema;
				async handle() {
					return 0;
				}
			}

			const command = new TestCmd();
			await expect(
				command.run({
					...commandRunOption,
					args: ['test.txt', 'extra1', 'extra2'],
				}),
			).rejects.toThrow(TooManyArguments);
		});

		it('should allow exact number of arguments', async () => {
			const handlerFn = vi.fn().mockReturnValue(0);

			class TestCmd extends Command {
				static command = 'test';
				static strictMode = true;
				static args = { file: Args.string() } satisfies ArgsSchema;
				async handle() {
					return handlerFn();
				}
			}

			const command = new TestCmd();
			const result = await command.run({
				...commandRunOption,
				args: ['test.txt'],
			});

			expect(result).toBe(0);
			expect(handlerFn).toHaveBeenCalled();
		});
	});

	describe('Type safety with Parsed<T>', () => {
		it('should maintain type safety through static options', async () => {
			type Context = { userId: string };

			class TestCmd extends Command<Context> {
				static command = 'test';
				static flags = { verbose: Flags.boolean(), count: Flags.number() } satisfies FlagsSchema;
				async handle(ctx: Context, { flags }: Parsed<typeof TestCmd>) {
					// Type checking - these should compile
					const _userId: string = ctx.userId;
					const _verbose: boolean | null = flags.verbose;
					const _count: number | null = flags.count;
					return 0;
				}
			}

			const command = new TestCmd();
			await command.run({ ...commandRunOption, ctx: { userId: '123' }, args: [] });
		});

		it('should maintain type safety through static args', async () => {
			class TestCmd extends Command {
				static command = 'test';
				static args = { file: Args.string(), lines: Args.number() } satisfies ArgsSchema;
				async handle(ctx: any, { args }: Parsed<typeof TestCmd>) {
					// Type checking
					const _file: string | null = args.file;
					const _lines: number | null = args.lines;
					return 0;
				}
			}

			const command = new TestCmd();
			await command.run({
				...commandRunOption,
				args: ['test.txt', '10'],
			});
		});
	});
});
