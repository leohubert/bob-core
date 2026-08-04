import { faker } from '@faker-js/faker';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cli, CliOptions } from '@/src/Cli.js';
import { Command } from '@/src/Command.js';
import { Args } from '@/src/args/index.js';
import { writesMachineOutput } from '@/src/completion/types.js';
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

	describe('Built-in completion commands', () => {
		/** Everything the built-ins print goes through the logger, one call per invocation. */
		function printed(): string {
			return logger.log.mock.calls.map(call => call.join(' ')).join('\n');
		}

		it('resolves `completion <shell>` by name and prints a script for the real binary name', async () => {
			cli = new Cli({ ...cliOptions, binName: 'mycli' });

			const code = await cli.runCommand('completion', 'fish');

			expect(code).toBe(0);
			expect(printed()).toContain('complete -c mycli -f');
		});

		it('rejects a shell with no renderer as an invalid argument, naming what is on offer', async () => {
			// Guards against re-listing a shell in COMPLETION_SHELLS before it has a renderer: the
			// option set is the single source of truth for what we claim to support.
			const code = await cli.runCommand('completion', 'zsh');

			expect(code).toBe(-1);
			expect(printed()).toContain('must be one of: "fish"');
		});

		it('infers the shell from $SHELL, so a bare `completion` can be redirected straight into a file', async () => {
			vi.stubEnv('SHELL', '/opt/homebrew/bin/fish');
			cli = new Cli({ ...cliOptions, binName: 'mycli' });

			const code = await cli.runCommand('completion');

			expect(code).toBe(0);
			expect(printed()).toContain('complete -c mycli -f');
		});

		it('refuses rather than prompting when $SHELL is one we cannot render', async () => {
			// Prompting here would draw a select into whatever file stdout points at.
			vi.stubEnv('SHELL', '/bin/zsh');
			cli = new Cli({ ...cliOptions, binName: 'mycli' });

			const code = await cli.runCommand('completion');

			expect(code).toBe(-1);
			expect(printed()).not.toContain('complete -c');
		});

		it('keeps the install hint off stdout, so a redirect captures only the script', async () => {
			cli = new Cli({ ...cliOptions, binName: 'mycli' });

			await cli.runCommand('completion', 'fish');

			expect(logger.log).toHaveBeenCalledOnce();
			expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('~/.config/fish/completions/mycli.fish'));
		});

		it('answers `__complete` with the registered commands', async () => {
			await cli.withCommands(makeCommand('deploy'));

			const code = await cli.runCommand('__complete', 'fish', '--current=dep', '--', 'mycli');

			expect(code).toBe(0);
			expect(printed()).toContain('deploy');
		});

		it('keeps `__complete` out of the discovery surface', async () => {
			const complete = cli.commandRegistry.findCommand('__complete');

			expect(complete?.hidden).toBe(true);
		});

		it('never fails and never speaks when the line is nonsense — it runs on every keypress', async () => {
			const code = await cli.runCommand('__complete', 'not-a-shell', '--current=x', '--', 'mycli', 'whatever');

			expect(code).toBe(0);
			expect(logger.log).not.toHaveBeenCalled();
		});

		it('tells a host which invocations write machine-readable stdout', () => {
			// A host with a banner, an update check or a rebuild has to stay silent for these.
			expect(writesMachineOutput(['__complete', 'fish'])).toBe(true);
			expect(writesMachineOutput(['completion', 'fish'])).toBe(true);
			expect(writesMachineOutput(['deploy'])).toBe(false);
			expect(writesMachineOutput([])).toBe(false);
		});

		it('does not let the inherited --help flag hijack a line being completed', async () => {
			await cli.withCommands(makeCommand('deploy'));

			// Going through CommandParser would fire HelpCommandFlag and dump help into the
			// candidate list; `__complete` bypasses the parser precisely to avoid that.
			const code = await cli.runCommand('__complete', 'fish', '--current=--he', '--', 'mycli', 'deploy');

			expect(code).toBe(0);
			// One candidate line, not the help screen.
			expect(printed().split('\n')).toHaveLength(1);
			expect(printed()).toMatch(/^--help\t/);
			expect(printed()).not.toContain('Available commands');
		});
	});

	describe('Deferred command loading', () => {
		/**
		 * Queues a path source whose walk yields one synthetic command, and returns the spy standing in
		 * for the module import. Every assertion below is about whether that spy fires: importing
		 * command modules is the cost `__complete` exists to avoid, and the only way to observe it.
		 */
		async function deferOneCommand(target: Cli, name: string) {
			const resolver = vi.fn().mockResolvedValue(makeCommand(name));
			target.withCommandResolver(resolver);
			(target.commandRegistry as any).listCommandsFiles = async function* () {
				yield `/fake/${name}.ts`;
			};
			await target.withCommands('/fake');

			return resolver;
		}

		it('defers the walk to the first dispatch instead of doing it in withCommands', async () => {
			const resolver = await deferOneCommand(cli, 'deploy');

			expect(resolver).not.toHaveBeenCalled();

			await cli.runCommand('deploy');

			expect(resolver).toHaveBeenCalledOnce();
		});

		it('loads commands for help, which cannot render an index it has not seen', async () => {
			const resolver = await deferOneCommand(cli, 'deploy');

			await cli.runHelpCommand();

			expect(resolver).toHaveBeenCalledOnce();
			expect(logger.log.mock.calls.flat().join('\n')).toContain('deploy');
		});

		it('loads commands for __complete when it has no cache to answer from', async () => {
			const resolver = await deferOneCommand(cli, 'deploy');

			const code = await cli.runCommand('__complete', 'fish', '--current=dep', '--', 'mycli');

			expect(code).toBe(0);
			expect(resolver).toHaveBeenCalledOnce();
			expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('deploy'));
		});
	});

	describe('Completion cache', () => {
		let cacheDir: string;
		let cacheFile: string;

		beforeEach(() => {
			cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bob-completion-'));
			cacheFile = path.join(cacheDir, 'specs.json');
		});

		afterEach(() => {
			fs.rmSync(cacheDir, { recursive: true, force: true });
		});

		/** A CLI whose one command lives behind a deferred source, so imports stay observable. */
		async function newCachedCli(version: string, name = 'deploy') {
			const resolver = vi.fn().mockResolvedValue(makeCommand(name));
			const cached = new Cli({ ...cliOptions, binName: 'mycli', completionCache: { file: cacheFile, version } });
			cached.withCommandResolver(resolver);
			(cached.commandRegistry as any).listCommandsFiles = async function* () {
				yield `/fake/${name}.ts`;
			};
			await cached.withCommands('/fake');

			return { cli: cached, resolver };
		}

		async function complete(target: Cli, current: string) {
			return await target.runCommand('__complete', 'fish', `--current=${current}`, '--', 'mycli');
		}

		it('snapshots the specs on a miss and answers the next keypress without importing anything', async () => {
			const first = await newCachedCli('v1');
			await complete(first.cli, 'dep');

			expect(first.resolver).toHaveBeenCalledOnce();
			expect(fs.existsSync(cacheFile)).toBe(true);

			// This is the whole point of Part A: a warm keypress touches no command module at all.
			const second = await newCachedCli('v1');
			const code = await complete(second.cli, 'dep');

			expect(code).toBe(0);
			expect(second.resolver).not.toHaveBeenCalled();
			expect(logger.log).toHaveBeenLastCalledWith(expect.stringContaining('deploy'));
		});

		it('discards a snapshot from another build, so a rebuild refreshes completion for free', async () => {
			await complete((await newCachedCli('v1')).cli, 'dep');

			const rebuilt = await newCachedCli('v2', 'redeploy');
			await complete(rebuilt.cli, 'red');

			expect(rebuilt.resolver).toHaveBeenCalledOnce();
			expect(logger.log).toHaveBeenLastCalledWith(expect.stringContaining('redeploy'));
		});

		it('still resolves a dynamic slot on a cache hit, which needs the real command class', async () => {
			// The static path is served from disk, so nothing else would ever hydrate the registry —
			// a wrong laziness call here degrades completion to static-only without failing anything.
			const source = vi.fn().mockResolvedValue([{ name: 'Alpha', value: 'alpha' }]);
			const Search = class extends Command {
				static command = 'ship';
				static args = { target: Args.search({ source }) } satisfies ArgsSchema;
				async handle() {
					return 0;
				}
			};

			const build = async () => {
				const resolver = vi.fn().mockResolvedValue(Search);
				const target = new Cli({ ...cliOptions, binName: 'mycli', completionCache: { file: cacheFile, version: 'v1' } });
				target.withCommandResolver(resolver);
				(target.commandRegistry as any).listCommandsFiles = async function* () {
					yield '/fake/ship.ts';
				};
				await target.withCommands('/fake');

				return { cli: target, resolver };
			};

			await complete((await build()).cli, 'ship');

			const warm = await build();
			await warm.cli.runCommand('__complete', 'fish', '--current=', '--', 'mycli', 'ship');

			expect(source).toHaveBeenCalled();
			expect(warm.resolver).toHaveBeenCalledOnce();
			expect(logger.log).toHaveBeenLastCalledWith(expect.stringContaining('alpha'));
		});
	});

	describe('Disabling completion', () => {
		beforeEach(() => {
			cli = new Cli({ ...cliOptions, disableCompletion: true });
		});

		it('drops both halves of the pair — a script with no __complete behind it is a dead script', () => {
			expect(cli.commandRegistry.findCommand('completion')).toBeNull();
			expect(cli.commandRegistry.findCommand('__complete')).toBeNull();
		});

		it('treats completion as an unknown command', async () => {
			const code = await cli.runCommand('completion', 'fish');

			expect(code).toBe(-1);
			expect(logger.log.mock.calls.flat().join('\n')).not.toContain('complete -c');
		});

		it('still renders help, which measures the widest command name and has none to measure', async () => {
			const code = await cli.runHelpCommand();

			expect(code).toBe(0);
			expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Test CLI'));
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
