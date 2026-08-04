import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { Logger } from '@/src/Logger.js';
import { Flags } from '@/src/flags/index.js';
import { ArgsSchema } from '@/src/lib/types.js';

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
				static args = { file: Flags.string() } satisfies ArgsSchema;
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

		it('should auto-suggest a single close match and run it on confirmation', async () => {
			const handler = vi.fn().mockResolvedValue(0);
			registry.registerCommand(makeCommand('deploy', handler));

			(registry as any).ux = { askForConfirmation: vi.fn().mockResolvedValue(true) };

			const result = await registry.runCommand({}, 'deplog');
			expect(handler).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it('should throw CommandNotFoundError when user declines a single-match suggestion', async () => {
			registry.registerCommand(makeCommand('deploy'));
			(registry as any).ux = { askForConfirmation: vi.fn().mockResolvedValue(false) };

			await expect(registry.runCommand({}, 'deplog')).rejects.toThrow('not found');
		});

		it('should throw CommandNotFoundError when user cancels a single-match suggestion', async () => {
			registry.registerCommand(makeCommand('deploy'));
			(registry as any).ux = { askForConfirmation: vi.fn().mockResolvedValue(null) };

			await expect(registry.runCommand({}, 'deplog')).rejects.toThrow('not found');
			expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
		});

		it('should offer a select prompt when there are multiple equally-strong matches', async () => {
			const handler = vi.fn().mockResolvedValue(0);
			registry.registerCommand(makeCommand('list-users', handler));
			registry.registerCommand(makeCommand('list-posts'));

			const askForSelect = vi.fn().mockResolvedValue('list-users');
			(registry as any).ux = { askForSelect, askForConfirmation: vi.fn().mockResolvedValue(false) };

			const result = await registry.runCommand({}, 'list');
			expect(askForSelect).toHaveBeenCalled();
			expect(handler).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it('should throw and log when select prompt is cancelled with multiple matches', async () => {
			registry.registerCommand(makeCommand('list-users'));
			registry.registerCommand(makeCommand('list-posts'));

			(registry as any).ux = {
				askForSelect: vi.fn().mockResolvedValue(null),
				askForConfirmation: vi.fn().mockResolvedValue(null),
			};

			await expect(registry.runCommand({}, 'list')).rejects.toThrow('not found');
			expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
		});

		it('should throw without prompting when no command is similar enough', async () => {
			registry.registerCommand(makeCommand('deploy'));
			const askForSelect = vi.fn();
			const askForConfirmation = vi.fn();
			(registry as any).ux = { askForSelect, askForConfirmation };

			await expect(registry.runCommand({}, 'totally-unrelated-name')).rejects.toThrow('not found');
			expect(askForSelect).not.toHaveBeenCalled();
			expect(askForConfirmation).not.toHaveBeenCalled();
		});

		it('should not suggest a command for unrelated short typos (regression: test vs update)', async () => {
			registry.registerCommand(makeCommand('update'));
			const askForSelect = vi.fn();
			const askForConfirmation = vi.fn();
			(registry as any).ux = { askForSelect, askForConfirmation };

			await expect(registry.runCommand({}, 'test')).rejects.toThrow('not found');
			expect(askForSelect).not.toHaveBeenCalled();
			expect(askForConfirmation).not.toHaveBeenCalled();
		});
	});

	describe('Custom command resolver', () => {
		it('should invoke a registered custom resolver when loading commands from a path', async () => {
			const tmpFile = '/tmp/bob-fake-command.ts';
			const customResolver = vi.fn().mockResolvedValue(makeCommand('custom'));
			registry.withCommandResolver(customResolver);
			// Override the file lister to yield exactly one synthetic file path.
			(registry as any).listCommandsFiles = async function* () {
				yield tmpFile;
			};

			await registry.loadCommandsPath('/anything');

			expect(customResolver).toHaveBeenCalledExactlyOnceWith(tmpFile);
			expect(registry.getAvailableCommands()).toContain('custom');
		});

		it('should wrap readdir errors with the offending path', async () => {
			await expect(registry.loadCommandsPath('/this/path/does/not/exist')).rejects.toThrow(
				/Failed to read commands directory "\/this\/path\/does\/not\/exist"/,
			);
		});
	});

	describe('Deferred command sources', () => {
		/**
		 * Stands in for the directory walk. Counting resolver calls is the point: a command's name
		 * lives in its class, so "discovering" one means importing its module, and that import cost is
		 * exactly what deferral exists to avoid.
		 */
		function fakeSource(registry: CommandRegistry, name: string) {
			const resolver = vi.fn().mockResolvedValue(makeCommand(name));
			registry.withCommandResolver(resolver);
			(registry as any).listCommandsFiles = async function* () {
				yield `/fake/${name}.ts`;
			};

			return resolver;
		}

		it('imports nothing until the registry is asked for something', async () => {
			const resolver = fakeSource(registry, 'deferred');

			registry.deferCommandsPath('/anything');

			expect(resolver).not.toHaveBeenCalled();
			expect(registry.getAvailableCommands()).not.toContain('deferred');

			await registry.ensureLoaded();

			expect(resolver).toHaveBeenCalledOnce();
			expect(registry.getAvailableCommands()).toContain('deferred');
		});

		it('walks each queued source exactly once across concurrent and repeated calls', async () => {
			const resolver = fakeSource(registry, 'once');

			registry.deferCommandsPath('/anything');
			await Promise.all([registry.ensureLoaded(), registry.ensureLoaded()]);
			await registry.ensureLoaded();

			// Without the memo the second call re-registers the same name, which throws.
			expect(resolver).toHaveBeenCalledOnce();
		});

		it('walks a source queued after an earlier load already finished', async () => {
			fakeSource(registry, 'first');
			registry.deferCommandsPath('/first');
			await registry.ensureLoaded();

			fakeSource(registry, 'second');
			registry.deferCommandsPath('/second');
			await registry.ensureLoaded();

			expect(registry.getAvailableCommands()).toEqual(expect.arrayContaining(['first', 'second']));
		});
	});

	describe('Instance registration', () => {
		it('reuses a registered instance instead of constructing the class, so injected collaborators survive', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);

			class Injected extends Command {
				static command = 'injected';
				constructor(private dependency: string) {
					super();
				}
				async handle() {
					return handlerFn(this.dependency);
				}
			}

			registry.registerCommand(new Injected('wired'));
			await registry.runCommand({}, 'injected');

			// Constructing the class per run would have thrown or passed `undefined` here.
			expect(handlerFn).toHaveBeenCalledWith('wired');
		});

		it('registers aliases declared on an instance-registered command', () => {
			const Aliased = makeCommand('aliased', undefined, ['al']);

			registry.registerCommand(new (Aliased as any)());

			expect(registry.getAvailableCommands()).toContain('al');
		});

		it('still reports classes from getCommands, so static metadata stays readable', () => {
			const Cmd = makeCommand('as-instance');

			registry.registerCommand(new (Cmd as any)());

			expect(registry.getCommands()).toContain(Cmd);
		});
	});

	describe('Built-in commands', () => {
		function builtIn(name: string, handler?: () => any) {
			return new (class extends Command {
				static command = name;
				async handle() {
					return handler?.() ?? 0;
				}
			})();
		}

		it('resolves a built-in by name', async () => {
			const handlerFn = vi.fn().mockResolvedValue(0);
			registry.registerBuiltInCommand(builtIn('help', handlerFn));

			await registry.runCommand({}, 'help');

			expect(handlerFn).toHaveBeenCalled();
		});

		it('lets a host command of the same name shadow it silently — a CLI may ship its own help', () => {
			registry.registerBuiltInCommand(builtIn('help'));
			const HostHelp = makeCommand('help');

			// The point: no duplicate-name error, unlike two host commands sharing a name.
			expect(() => registry.registerCommand(HostHelp)).not.toThrow();
			expect(registry.findCommand('help')).toBe(HostHelp);
		});

		it('reports the shadowed built-in only once, so help does not list it twice', () => {
			registry.registerBuiltInCommand(builtIn('help'));
			registry.registerCommand(makeCommand('help'));

			expect(registry.getAvailableCommands().filter(name => name === 'help')).toHaveLength(1);
			expect(registry.getCommands()).toHaveLength(1);
		});

		it('includes an unshadowed built-in in the listings', () => {
			registry.registerBuiltInCommand(builtIn('help'));

			expect(registry.getAvailableCommands()).toContain('help');
			expect(registry.getCommands().map(Cmd => Cmd.command)).toContain('help');
		});

		it('refuses a built-in with no name', () => {
			expect(() => registry.registerBuiltInCommand(builtIn(''))).toThrow('Cannot register a built-in command with no name');
		});
	});

	describe('findCommand', () => {
		it('resolves by canonical name and by alias', () => {
			const Cmd = makeCommand('download', undefined, ['dl']);
			registry.registerCommand(Cmd);

			expect(registry.findCommand('download')).toBe(Cmd);
			expect(registry.findCommand('dl')).toBe(Cmd);
		});

		it('returns null for an unknown name rather than throwing, so callers can degrade quietly', () => {
			expect(registry.findCommand('nope')).toBeNull();
		});
	});
});
