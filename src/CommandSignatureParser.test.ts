import { MaybeMockedDeep } from '@vitest/spy';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandIO } from '@/src/CommandIO.js';
import { CommandSignatureParser } from '@/src/CommandSignatureParser.js';
import { CommandOption } from '@/src/contracts/index.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { TestLogger, newTestLogger } from '@/src/testFixtures.js';

class TestCommandOptions implements CommandOption<Command> {
	option = 'testOption';
	description = 'Test option';
	type = 'string' as const;
	default?: string | null = 'default';

	alias = ['t'];

	async handler() {
		return 0;
	}
}

describe('CommandParser', () => {
	let commandParser: CommandSignatureParser;
	let commandIO: MaybeMockedDeep<CommandIO>;
	let logger: TestLogger;
	let parseCommand: (
		signature: string,
		args: string[],
		helperDefinition?: Record<string, string>,
		defaultCommandOptions?: CommandOption<Command>[],
	) => CommandSignatureParser;

	beforeAll(() => {
		logger = newTestLogger();
		commandIO = vi.mockObject(
			new CommandIO({
				logger: logger,
			}),
		);
		parseCommand = (signature: string, args: string[], helperDefinition: Record<string, string> = {}, defaultCommandOptions: CommandOption<Command>[] = []) => {
			const parser = new CommandSignatureParser({
				io: commandIO,
				signature,
				helperDefinitions: helperDefinition,
				defaultOptions: defaultCommandOptions,
			});
			parser.init(args);
			return parser;
		};
	});

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should parse signature without arguments & options', () => {
		commandParser = parseCommand('test', []);
		expect(commandParser.command).toBe('test');
	});

	describe('Arguments', () => {
		it('should parse signature with arguments', () => {
			commandParser = parseCommand('test {arg1} {arg2}', ['value1', 'value2']);
			expect(commandParser.argument('arg1')).toBe('value1');
			expect(commandParser.argument('arg2')).toBe('value2');
		});

		it('should parse signature with optional arguments', () => {
			commandParser = parseCommand('test {arg1?} {arg2?}', ['value1']);
			expect(commandParser.argument('arg1')).toBe('value1');
			expect(commandParser.argument('arg2')).toBeNull();
		});

		it('should parse signature with optional arguments with default value', () => {
			commandParser = parseCommand('test {arg1?} {arg2=defaultValue1}', ['value1']);
			expect(commandParser.argument('arg1')).toBe('value1');
			expect(commandParser.argument('arg2')).toBe('defaultValue1');
		});

		it('should parse signature with variadic arguments', () => {
			commandParser = parseCommand('test {arg1*}', ['value1', 'value2']);
			expect(commandParser.argument('arg1')).toEqual(['value1', 'value2']);
		});

		it('should parse signature with optional variadic arguments', () => {
			commandParser = parseCommand('test {arg1*?}', ['value1', 'value2']);
			expect(commandParser.argument('arg1')).toEqual(['value1', 'value2']);
		});

		it('should parse signature with optional variadic arguments without value', () => {
			commandParser = parseCommand('test {arg1*?}', []);
			expect(commandParser.argument('arg1')).toEqual([]);
		});

		it('should set argument value', () => {
			commandParser = parseCommand('test {arg1}', ['value1']);
			commandParser.setArgument('arg1', 'newValue');
			expect(commandParser.argument('arg1')).toBe('newValue');
		});

		it('should throw error when argument is missing with setArgument', () => {
			commandParser = parseCommand('test {arg1}', []);
			expect(() => commandParser.setArgument('arg2', 'newValue')).toThrowError(Error);
		});

		it('should ask for input when argument is missing and CommandIO is provided', async () => {
			commandIO.askForInput.mockResolvedValue('inputValue');

			commandParser = parseCommand('test {arg1}', []);

			await commandParser.validate();

			expect(commandParser.argument('arg1')).toBe('inputValue');
		});

		it('should throw error when argument is missing and CommandIO returns null', async () => {
			commandIO.askForInput.mockResolvedValue(null);

			commandParser = parseCommand('test {arg1}', []);

			await expect(commandParser.validate()).rejects.toThrowError(MissingRequiredArgumentValue);
		});

		it('calling validate method should throw error when argument is missing', async () => {
			commandParser = parseCommand('test {arg1}', []);
			await expect(commandParser.validate()).rejects.toThrowError(MissingRequiredArgumentValue);
		});

		it('calling validate should throw with variadic argument is missing', async () => {
			commandParser = parseCommand('test {arg1*}', []);

			await expect(commandParser.validate()).rejects.toThrowError(MissingRequiredArgumentValue);
		});
	});

	describe('Options', () => {
		it('boolean option should be false when not provided', () => {
			commandParser = parseCommand('test {--option}', []);
			expect(commandParser.option('option')).toBeFalsy();
		});

		it('boolean option should be true when provided', () => {
			commandParser = parseCommand('test {--option}', ['--option']);
			expect(commandParser.option('option')).toBeTruthy();
		});

		it('boolean option should be true when provided with value', () => {
			commandParser = parseCommand('test {--option}', ['--option=true']);
			expect(commandParser.option('option')).toBeTruthy();
		});

		it('boolean option should be false when provided with value', () => {
			commandParser = parseCommand('test {--option}', ['--option=false']);
			expect(commandParser.option('option')).toBeFalsy();
		});

		it('string option should be null when not provided', () => {
			commandParser = parseCommand('test {--option=}', []);
			expect(commandParser.option('option')).toBeNull();
		});

		it('string option should be value when provided', () => {
			commandParser = parseCommand('test {--option=}', ['--option=value']);
			expect(commandParser.option('option')).toBe('value');
		});

		it('string option should take the default value when not provided', () => {
			commandParser = parseCommand('test {--option=default}', []);
			expect(commandParser.option('option')).toBe('default');
		});

		it('string option should take the provided value with default value', () => {
			commandParser = parseCommand('test {--option=default}', ['--option=value']);
			expect(commandParser.option('option')).toBe('value');
		});

		it('array option should be empty when not provided', () => {
			commandParser = parseCommand('test {--option=*}', []);
			expect(commandParser.option('option')).toEqual([]);
		});

		it('array option should be value when provided', () => {
			commandParser = parseCommand('test {--option=*}', ['--option=value1', '--option=value2']);
			expect(commandParser.option('option')).toEqual(['value1', 'value2']);
		});
	});

	describe('Mixed', () => {
		it('should parse signature with arguments and options', () => {
			commandParser = parseCommand('test {arg1} {arg2} {--option}', ['value1', 'value2', '--option']);
			expect(commandParser.argument('arg1')).toBe('value1');
			expect(commandParser.argument('arg2')).toBe('value2');
			expect(commandParser.option('option')).toBeTruthy();
		});

		it('should parse signature with optional arguments and options', () => {
			commandParser = parseCommand('test {arg1?} {arg2?} {--option}', ['value1', '--option']);
			expect(commandParser.argument('arg1')).toBe('value1');
			expect(commandParser.argument('arg2')).toBeNull();
			expect(commandParser.option('option')).toBeTruthy();
		});
	});

	describe('DefaultCommandOptions', () => {
		it('should parse default command options', () => {
			commandParser = parseCommand('test', [], {}, [new TestCommandOptions()]);
			expect(commandParser.option('testOption')).toBe('default');
		});

		it('should parse default command options with provided value', () => {
			commandParser = parseCommand('test', ['--testOption=value'], {}, [new TestCommandOptions()]);
			expect(commandParser.option('testOption')).toBe('value');
		});

		it('should parse default command options with provided value with alias', () => {
			commandParser = parseCommand('test', ['-t=value'], {}, [new TestCommandOptions()]);
			expect(commandParser.option('testOption')).toBe('value');
		});

		it('should handle null default value', () => {
			const option = new TestCommandOptions();
			option.default = undefined;
			commandParser = parseCommand('test', ['--testOption=value'], {}, [option]);
			expect(commandParser.option('testOption')).toBe('value');
		});
	});
});
