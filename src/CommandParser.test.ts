import { beforeEach, describe, expect, it } from 'vitest';

import { CommandIO } from '@/src/CommandIO.js';
import { CommandParser } from '@/src/CommandParser.js';
import { BadCommandOption } from '@/src/errors/BadCommandOption.js';
import { InvalidOption } from '@/src/errors/InvalidOption.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { MissingRequiredOptionValue } from '@/src/errors/MissingRequiredOptionValue.js';
import { TestLogger, newTestLogger } from '@/src/testFixtures.js';

describe('CommandParser', () => {
	let io: CommandIO;
	let logger: TestLogger;

	beforeEach(() => {
		logger = newTestLogger();
		io = new CommandIO(logger);
	});

	describe('Basic parsing', () => {
		it('should parse empty arguments', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: {},
			});

			const result = parser.init([]);

			expect(result.options).toEqual({});
			expect(result.arguments).toEqual({});
		});

		it('should parse boolean options', () => {
			const parser = new CommandParser({
				io,
				options: { verbose: 'boolean', debug: 'boolean' },
				arguments: {},
			});

			const result = parser.init(['--verbose', '--debug']);

			expect(result.options.verbose).toBe(true);
			expect(result.options.debug).toBe(true);
		});

		it('should default boolean options to false', () => {
			const parser = new CommandParser({
				io,
				options: { verbose: 'boolean' },
				arguments: {},
			});

			const result = parser.init([]);

			expect(result.options.verbose).toBe(false);
		});

		it('should parse string options', () => {
			const parser = new CommandParser({
				io,
				options: { name: 'string', output: 'string' },
				arguments: {},
			});

			const result = parser.init(['--name', 'test', '--output', 'file.txt']);

			expect(result.options.name).toBe('test');
			expect(result.options.output).toBe('file.txt');
		});

		it('should parse number options', () => {
			const parser = new CommandParser({
				io,
				options: { count: 'number', limit: 'number' },
				arguments: {},
			});

			const result = parser.init(['--count', '42', '--limit', '100']);

			expect(result.options.count).toBe(42);
			expect(result.options.limit).toBe(100);
		});

		it('should parse positional arguments', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: { file: 'string', lines: 'number' },
			});

			const result = parser.init(['test.txt', '50']);

			expect(result.arguments.file).toBe('test.txt');
			expect(result.arguments.lines).toBe(50);
		});

		it('should parse mixed options and arguments', () => {
			const parser = new CommandParser({
				io,
				options: { verbose: 'boolean' },
				arguments: { file: 'string' },
			});

			const result = parser.init(['test.txt', '--verbose']);

			expect(result.options.verbose).toBe(true);
			expect(result.arguments.file).toBe('test.txt');
		});
	});

	describe('Option definitions', () => {
		it('should handle options with descriptions', () => {
			const parser = new CommandParser({
				io,
				options: {
					verbose: {
						type: 'boolean',
						description: 'Enable verbose output',
					},
				},
				arguments: {},
			});

			const result = parser.init(['--verbose']);

			expect(result.options.verbose).toBe(true);
		});

		it('should handle required options', () => {
			const parser = new CommandParser({
				io,
				options: {
					name: { type: 'string', required: true },
				},
				arguments: {},
			});

			const result = parser.init(['--name', 'test']);

			expect(result.options.name).toBe('test');
		});

		it('should handle default values', () => {
			const parser = new CommandParser({
				io,
				options: {
					port: { type: 'number', default: 8080 },
					host: { type: 'string', default: 'localhost' },
				},
				arguments: {},
			});

			const result = parser.init([]);

			expect(result.options.port).toBe(8080);
			expect(result.options.host).toBe('localhost');
		});

		it('should override default values when provided', () => {
			const parser = new CommandParser({
				io,
				options: {
					port: { type: 'number', default: 8080 },
				},
				arguments: {},
			});

			const result = parser.init(['--port', '3000']);

			expect(result.options.port).toBe(3000);
		});
	});

	describe('Option aliases', () => {
		it('should handle single character aliases', () => {
			const parser = new CommandParser({
				io,
				options: {
					verbose: { type: 'boolean', alias: 'v' },
				},
				arguments: {},
			});

			const result = parser.init(['-v']);

			expect(result.options.verbose).toBe(true);
		});

		it('should handle multiple aliases', () => {
			const parser = new CommandParser({
				io,
				options: {
					output: { type: 'string', alias: ['o', 'out'] },
				},
				arguments: {},
			});

			const result1 = parser.init(['-o', 'file.txt']);
			expect(result1.options.output).toBe('file.txt');

			const parser2 = new CommandParser({
				io,
				options: {
					output: { type: 'string', alias: ['o', 'out'] },
				},
				arguments: {},
			});

			const result2 = parser2.init(['--out', 'file.txt']);
			expect(result2.options.output).toBe('file.txt');
		});
	});

	describe('Array options', () => {
		it('should parse string array options', () => {
			const parser = new CommandParser({
				io,
				options: {
					files: ['string'],
				},
				arguments: {},
			});

			const result = parser.init(['--files', 'a.txt', '--files', 'b.txt']);

			expect(result.options.files).toEqual(['a.txt', 'b.txt']);
		});

		it('should parse number array options', () => {
			const parser = new CommandParser({
				io,
				options: {
					ports: ['number'],
				},
				arguments: {},
			});

			const result = parser.init(['--ports', '8080', '--ports', '3000']);

			expect(result.options.ports).toEqual([8080, 3000]);
		});

		it('should default to empty array when no values provided', () => {
			const parser = new CommandParser({
				io,
				options: {
					tags: ['string'],
				},
				arguments: {},
			});

			const result = parser.init([]);

			expect(result.options.tags).toEqual([]);
		});
	});

	describe('Variadic arguments', () => {
		it('should collect all remaining arguments as variadic', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: {
					files: { type: ['string'], variadic: true },
				},
			});

			const result = parser.init(['a.txt', 'b.txt', 'c.txt']);

			expect(result.arguments.files).toEqual(['a.txt', 'b.txt', 'c.txt']);
		});

		it('should handle variadic after regular arguments', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: {
					command: 'string',
					args: { type: ['string'], variadic: true },
				},
			});

			const result = parser.init(['run', 'arg1', 'arg2', 'arg3']);

			expect(result.arguments.command).toBe('run');
			expect(result.arguments.args).toEqual(['arg1', 'arg2', 'arg3']);
		});

		it('should default variadic to empty array when no values', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: {
					files: { type: ['string'], variadic: true },
				},
			});

			const result = parser.init([]);

			expect(result.arguments.files).toEqual([]);
		});
	});

	describe('Validation', () => {
		it('should validate required options that have no default', async () => {
			const parser = new CommandParser({
				io,
				options: {
					name: { type: 'string', required: false },
				},
				arguments: {},
			});

			// Set up parser state manually to test validate() method
			parser.init([]);

			// Manually override to make it required for validate test
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(parser as any).options.name.required = true;

			// validate() should check for required values
			await expect(parser.validate()).rejects.toThrow(MissingRequiredOptionValue);
		});

		it('should validate required arguments', async () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: {
					file: { type: 'string', required: true },
				},
			}).disablePrompting();

			parser.init([]);

			await expect(parser.validate()).rejects.toThrow(MissingRequiredArgumentValue);
		});

		it('should pass validation when all required values provided', async () => {
			const parser = new CommandParser({
				io,
				options: {
					name: { type: 'string', required: true },
				},
				arguments: {
					file: { type: 'string', required: true },
				},
			});

			parser.init(['test.txt', '--name', 'value']);

			await expect(parser.validate()).resolves.toBeUndefined();
		});

		it('should throw InvalidOption for unknown options', () => {
			const parser = new CommandParser({
				io,
				options: {
					verbose: 'boolean',
				},
				arguments: {},
			});

			expect(() => parser.init(['--unknown'])).toThrow(InvalidOption);
		});
	});

	describe('Accessor methods', () => {
		it('should retrieve option values', () => {
			const parser = new CommandParser({
				io,
				options: { verbose: 'boolean', name: 'string' },
				arguments: {},
			});

			parser.init(['--verbose', '--name', 'test']);

			expect(parser.option('verbose')).toBe(true);
			expect(parser.option('name')).toBe('test');
		});

		it('should retrieve argument values', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: { file: 'string', count: 'number' },
			});

			parser.init(['test.txt', '42']);

			expect(parser.argument('file')).toBe('test.txt');
			expect(parser.argument('count')).toBe(42);
		});

		it('should throw error when accessing options before init', () => {
			const parser = new CommandParser({
				io,
				options: { verbose: 'boolean' },
				arguments: {},
			});

			expect(() => parser.option('verbose')).toThrow('Options have not been parsed yet');
		});

		it('should throw error when accessing arguments before init', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: { file: 'string' },
			});

			expect(() => parser.argument('file')).toThrow('Arguments have not been parsed yet');
		});
	});

	describe('Metadata methods', () => {
		it('should return option definitions', () => {
			const parser = new CommandParser({
				io,
				options: {
					verbose: 'boolean',
					count: { type: 'number', default: 10 },
				},
				arguments: {},
			});

			const defs = parser.optionDefinitions();

			expect(defs.verbose.type).toBe('boolean');
			expect(defs.count.type).toBe('number');
			expect(defs.count.default).toBe(10);
		});

		it('should return argument definitions', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: {
					file: 'string',
					lines: { type: 'number', required: true },
				},
			});

			const defs = parser.argumentDefinitions();

			expect(defs.file.type).toBe('string');
			expect(defs.lines.type).toBe('number');
			expect(defs.lines.required).toBe(true);
		});

		it('should return available option names', () => {
			const parser = new CommandParser({
				io,
				options: { verbose: 'boolean', output: 'string' },
				arguments: {},
			});

			const names = parser.availableOptions();

			expect(names).toEqual(['verbose', 'output']);
		});

		it('should return available argument names', () => {
			const parser = new CommandParser({
				io,
				options: {},
				arguments: { file: 'string', count: 'number' },
			});

			const names = parser.availableArguments();

			expect(names).toEqual(['file', 'count']);
		});
	});

	describe('Edge cases', () => {
		it('should handle empty string values', () => {
			const parser = new CommandParser({
				io,
				options: { message: 'string' },
				arguments: {},
			});

			const result = parser.init(['--message', '']);

			expect(result.options.message).toBe('');
		});

		it('should handle negative numbers with double dash', () => {
			const parser = new CommandParser({
				io,
				options: { offset: 'number' },
				arguments: {},
			});

			const result = parser.init(['--', '--offset', '-42']);

			expect(result.options.offset).toBeNull();
		});

		it('should handle floating point numbers', () => {
			const parser = new CommandParser({
				io,
				options: { ratio: 'number' },
				arguments: {},
			});

			const result = parser.init(['--ratio', '3.14']);

			expect(result.options.ratio).toBe(3.14);
		});

		it('should handle options with equals sign syntax', () => {
			const parser = new CommandParser({
				io,
				options: { name: 'string' },
				arguments: {},
			});

			const result = parser.init(['--name=test']);

			expect(result.options.name).toBe('test');
		});

		it('should handle mixed positional and option ordering', () => {
			const parser = new CommandParser({
				io,
				options: { verbose: 'boolean' },
				arguments: { file: 'string', lines: 'number' },
			});

			const result = parser.init(['test.txt', '100', '--verbose']);

			expect(result.arguments.file).toBe('test.txt');
			expect(result.arguments.lines).toBe(100);
			expect(result.options.verbose).toBe(true);
		});
	});

	describe('Type conversion errors', () => {
		it('should handle invalid number conversion', () => {
			const parser = new CommandParser({
				io,
				options: { count: 'number' },
				arguments: {},
			});

			expect(() => parser.init(['--count', 'not-a-number'])).toThrow(BadCommandOption);
		});
	});
});
