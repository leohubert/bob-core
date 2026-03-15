import { MaybeMockedDeep } from '@vitest/spy';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandParser } from '@/src/CommandParser.js';
import { CommandSignatureParser } from '@/src/CommandSignatureParser.js';
import { UX } from '@/src/ux/index.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { TestLogger, newTestLogger } from '@/src/fixtures.test.js';

describe('CommandSignatureParser', () => {
	describe('parse()', () => {
		it('should parse command name', () => {
			const result = CommandSignatureParser.parse('test');
			expect(result.command).toBe('test');
			expect(result.flags).toEqual({});
			expect(result.args).toEqual({});
		});

		it('should parse required argument', () => {
			const result = CommandSignatureParser.parse('test {arg1}');
			expect(result.args.arg1).toBeDefined();
			expect(result.args.arg1.type).toBe('string');
			expect(result.args.arg1.required).toBe(true);
			expect(result.args.arg1.parse).toBeTypeOf('function');
		});

		it('should parse optional argument', () => {
			const result = CommandSignatureParser.parse('test {arg1?}');
			expect(result.args.arg1.type).toBe('string');
			expect(result.args.arg1.required).toBeUndefined();
		});

		it('should parse argument with default value', () => {
			const result = CommandSignatureParser.parse('test {arg1=defaultValue}');
			expect(result.args.arg1.type).toBe('string');
			expect(result.args.arg1.default).toBe('defaultValue');
		});

		it('should parse variadic argument', () => {
			const result = CommandSignatureParser.parse('test {arg1*}');
			expect(result.args.arg1.type).toBe('string');
			expect('multiple' in result.args.arg1 && result.args.arg1.multiple).toBe(true);
			expect(result.args.arg1.required).toBe(true);
			expect(result.args.arg1.default).toEqual([]);
		});

		it('should parse argument with description', () => {
			const result = CommandSignatureParser.parse('test {arg1:The first argument}');
			expect(result.args.arg1.description).toBe('The first argument');
			expect(result.args.arg1.required).toBe(true);
		});

		it('should parse boolean flag', () => {
			const result = CommandSignatureParser.parse('test {--force}');
			expect(result.flags.force).toBeDefined();
			expect(result.flags.force.type).toBe('boolean');
			expect(result.flags.force.default).toBe(false);
		});

		it('should parse string flag', () => {
			const result = CommandSignatureParser.parse('test {--name=}');
			expect(result.flags.name.type).toBe('string');
			expect(result.flags.name.default).toBeNull();
		});

		it('should parse string flag with default', () => {
			const result = CommandSignatureParser.parse('test {--name=hello}');
			expect(result.flags.name.type).toBe('string');
			expect(result.flags.name.default).toBe('hello');
		});

		it('should parse array flag', () => {
			const result = CommandSignatureParser.parse('test {--tags=*}');
			expect(result.flags.tags.type).toBe('string');
			expect('multiple' in result.flags.tags && result.flags.tags.multiple).toBe(true);
			expect(result.flags.tags.default).toEqual([]);
		});

		it('should parse flag with alias', () => {
			const result = CommandSignatureParser.parse('test {--force|f}');
			expect(result.flags.force.type).toBe('boolean');
			expect(result.flags.force.alias).toEqual(['f']);
		});

		it('should parse boolean flag with default true', () => {
			const result = CommandSignatureParser.parse('test {--verbose=true}');
			expect(result.flags.verbose.type).toBe('boolean');
			expect(result.flags.verbose.default).toBe(true);
		});

		it('should parse boolean flag with default false', () => {
			const result = CommandSignatureParser.parse('test {--verbose=false}');
			expect(result.flags.verbose.type).toBe('boolean');
			expect(result.flags.verbose.default).toBe(false);
		});

		it('should use helperDefinitions for descriptions', () => {
			const result = CommandSignatureParser.parse('test {arg1} {--force}', {
				'arg1': 'The first argument',
				'--force': 'Force the operation',
			});
			expect(result.args.arg1.description).toBe('The first argument');
			expect(result.flags.force.description).toBe('Force the operation');
		});

		it('should prefer inline description over helperDefinitions', () => {
			const result = CommandSignatureParser.parse('test {arg1:inline desc}', {
				arg1: 'helper desc',
			});
			expect(result.args.arg1.description).toBe('inline desc');
		});
	});

	describe('integration with CommandParser', () => {
		let ux: MaybeMockedDeep<UX>;
		let logger: TestLogger;

		beforeAll(() => {
			logger = newTestLogger();
			ux = vi.mockObject(new UX());
		});

		beforeEach(() => {
			vi.resetAllMocks();
		});

		async function parseAndInit(signature: string, args: string[], helperDefinitions: Record<string, string> = {}) {
			const parsed = CommandSignatureParser.parse(signature, helperDefinitions);
			const parser = new CommandParser({
				ux,
				ctx: {},
				flags: parsed.flags,
				args: parsed.args,
			});
			await parser.init(args);
			return parser;
		}

		it('should parse signature without arguments & options', () => {
			const parsed = CommandSignatureParser.parse('test');
			expect(parsed.command).toBe('test');
		});

		describe('Arguments', () => {
			it('should parse arguments', async () => {
				const parser = await parseAndInit('test {arg1} {arg2}', ['value1', 'value2']);
				expect(parser.argument('arg1')).toBe('value1');
				expect(parser.argument('arg2')).toBe('value2');
			});

			it('should parse optional arguments', async () => {
				const parser = await parseAndInit('test {arg1?} {arg2?}', ['value1']);
				expect(parser.argument('arg1')).toBe('value1');
				expect(parser.argument('arg2')).toBeNull();
			});

			it('should parse optional arguments with default value', async () => {
				const parser = await parseAndInit('test {arg1?} {arg2=defaultValue1}', ['value1']);
				expect(parser.argument('arg1')).toBe('value1');
				expect(parser.argument('arg2')).toBe('defaultValue1');
			});

			it('should parse variadic arguments', async () => {
				const parser = await parseAndInit('test {arg1*}', ['value1', 'value2']);
				expect(parser.argument('arg1')).toEqual(['value1', 'value2']);
			});

			it('should set argument value', async () => {
				const parser = await parseAndInit('test {arg1}', ['value1']);
				await parser.setArgument('arg1', 'newValue');
				expect(parser.argument('arg1')).toBe('newValue');
			});

			it('should throw error when argument is missing with setArgument', async () => {
				const parser = await parseAndInit('test {arg1}', []);
				await expect(parser.setArgument('arg2' as any, 'newValue')).rejects.toThrow(Error);
			});

			it('should ask for input when argument is missing', async () => {
				ux.askForInput.mockResolvedValue('inputValue');

				const parser = await parseAndInit('test {arg1}', []);
				await parser.validate();

				expect(parser.argument('arg1')).toBe('inputValue');
			});

			it('should throw error when argument is missing and UX returns null', async () => {
				ux.askForInput.mockResolvedValue(null);

				const parser = await parseAndInit('test {arg1}', []);
				await expect(parser.validate()).rejects.toThrow(MissingRequiredArgumentValue);
			});

			it('calling validate should throw with variadic argument missing', async () => {
				const parser = await parseAndInit('test {arg1*}', []);
				await expect(parser.validate()).rejects.toThrow(MissingRequiredArgumentValue);
			});
		});

		describe('Options', () => {
			it('boolean option should be false when not provided', async () => {
				const parser = await parseAndInit('test {--option}', []);
				expect(parser.flag('option')).toBe(false);
			});

			it('boolean option should be true when provided', async () => {
				const parser = await parseAndInit('test {--option}', ['--option']);
				expect(parser.flag('option')).toBe(true);
			});

			it('boolean option should be true when provided with value', async () => {
				const parser = await parseAndInit('test {--option}', ['--option=true']);
				expect(parser.flag('option')).toBe(true);
			});

			it('boolean option should be false when provided with value', async () => {
				const parser = await parseAndInit('test {--option}', ['--option=false']);
				expect(parser.flag('option')).toBe(false);
			});

			it('string option should be null when not provided', async () => {
				const parser = await parseAndInit('test {--option=}', []);
				expect(parser.flag('option')).toBeNull();
			});

			it('string option should be value when provided', async () => {
				const parser = await parseAndInit('test {--option=}', ['--option=value']);
				expect(parser.flag('option')).toBe('value');
			});

			it('string option should take the default value when not provided', async () => {
				const parser = await parseAndInit('test {--option=default}', []);
				expect(parser.flag('option')).toBe('default');
			});

			it('string option should take the provided value with default value', async () => {
				const parser = await parseAndInit('test {--option=default}', ['--option=value']);
				expect(parser.flag('option')).toBe('value');
			});

			it('array option should be empty when not provided', async () => {
				const parser = await parseAndInit('test {--option=*}', []);
				expect(parser.flag('option')).toEqual([]);
			});

			it('array option should be value when provided', async () => {
				const parser = await parseAndInit('test {--option=*}', ['--option=value1', '--option=value2']);
				expect(parser.flag('option')).toEqual(['value1', 'value2']);
			});
		});

		describe('Mixed', () => {
			it('should parse signature with arguments and options', async () => {
				const parser = await parseAndInit('test {arg1} {arg2} {--option}', ['value1', 'value2', '--option']);
				expect(parser.argument('arg1')).toBe('value1');
				expect(parser.argument('arg2')).toBe('value2');
				expect(parser.flag('option')).toBe(true);
			});

			it('should parse signature with optional arguments and options', async () => {
				const parser = await parseAndInit('test {arg1?} {arg2?} {--option}', ['value1', '--option']);
				expect(parser.argument('arg1')).toBe('value1');
				expect(parser.argument('arg2')).toBeNull();
				expect(parser.flag('option')).toBe(true);
			});
		});
	});
});
