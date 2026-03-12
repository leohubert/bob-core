import { beforeEach, describe, expect, it } from 'vitest';

import { CommandIO } from '@/src/CommandIO.js';
import { CommandParser } from '@/src/CommandParser.js';
import { BadCommandFlag } from '@/src/errors/BadCommandFlag.js';
import { InvalidOption } from '@/src/errors/InvalidOption.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { MissingRequiredOptionValue } from '@/src/errors/MissingRequiredOptionValue.js';
import { TooManyArguments } from '@/src/errors/TooManyArguments.js';
import { TestLogger, newTestLogger } from '@/src/fixtures.test.js';

describe('CommandParser', () => {
	let io: CommandIO;
	let logger: TestLogger;

	beforeEach(() => {
		logger = newTestLogger();
		io = new CommandIO({
			logger: logger,
		});
	});

	describe('Basic parsing', () => {
		it('should parse empty arguments', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags).toEqual({});
			expect(result.args).toEqual({});
		});

		it('should parse boolean options', async () => {
			const parser = new CommandParser({
				io,
				flags: { verbose: { type: 'boolean' }, debug: { type: 'boolean' } },
				args: {},
			});

			const result = await parser.init(['--verbose', '--debug']);

			expect(result.flags.verbose).toBe(true);
			expect(result.flags.debug).toBe(true);
		});

		it('should default boolean options to false', async () => {
			const parser = new CommandParser({
				io,
				flags: { verbose: { type: 'boolean' } },
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags.verbose).toBe(false);
		});

		it('should parse string options', async () => {
			const parser = new CommandParser({
				io,
				flags: { name: { type: 'string' }, output: { type: 'string' } },
				args: {},
			});

			const result = await parser.init(['--name', 'test', '--output', 'file.txt']);

			expect(result.flags.name).toBe('test');
			expect(result.flags.output).toBe('file.txt');
		});

		it('should parse number options', async () => {
			const parser = new CommandParser({
				io,
				flags: { count: { type: 'number' }, limit: { type: 'number' } },
				args: {},
			});

			const result = await parser.init(['--count', '42', '--limit', '100']);

			expect(result.flags.count).toBe(42);
			expect(result.flags.limit).toBe(100);
		});

		it('should parse positional arguments', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: { file: { type: 'string' }, lines: { type: 'number' } },
			});

			const result = await parser.init(['test.txt', '50']);

			expect(result.args.file).toBe('test.txt');
			expect(result.args.lines).toBe(50);
		});

		it('should parse mixed options and arguments', async () => {
			const parser = new CommandParser({
				io,
				flags: { verbose: { type: 'boolean' } },
				args: { file: { type: 'string' } },
			});

			const result = await parser.init(['test.txt', '--verbose']);

			expect(result.flags.verbose).toBe(true);
			expect(result.args.file).toBe('test.txt');
		});
	});

	describe('Option definitions', () => {
		it('should handle options with descriptions', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					verbose: {
						type: 'boolean',
						description: 'Enable verbose output',
					},
				},
				args: {},
			});

			const result = await parser.init(['--verbose']);

			expect(result.flags.verbose).toBe(true);
		});

		it('should handle required options', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					name: { type: 'string', required: true },
				},
				args: {},
			});

			const result = await parser.init(['--name', 'test']);

			expect(result.flags.name).toBe('test');
		});

		it('should handle default values', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					port: { type: 'number', default: 8080 },
					host: { type: 'string', default: 'localhost' },
				},
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags.port).toBe(8080);
			expect(result.flags.host).toBe('localhost');
		});

		it('should override default values when provided', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					port: { type: 'number', default: 8080 },
				},
				args: {},
			});

			const result = await parser.init(['--port', '3000']);

			expect(result.flags.port).toBe(3000);
		});
	});

	describe('Option aliases', () => {
		it('should handle single character aliases', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					verbose: { type: 'boolean', alias: 'v' },
				},
				args: {},
			});

			const result = await parser.init(['-v']);

			expect(result.flags.verbose).toBe(true);
		});

		it('should handle multiple aliases', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					output: { type: 'string', alias: ['o', 'out'] },
				},
				args: {},
			});

			const result1 = await parser.init(['-o', 'file.txt']);
			expect(result1.flags.output).toBe('file.txt');

			const parser2 = new CommandParser({
				io,
				flags: {
					output: { type: 'string', alias: ['o', 'out'] },
				},
				args: {},
			});

			const result2 = await parser2.init(['--out', 'file.txt']);
			expect(result2.flags.output).toBe('file.txt');
		});
	});

	describe('Array options', () => {
		it('should parse string array options', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					files: { type: ['string'] },
				},
				args: {},
			});

			const result = await parser.init(['--files', 'a.txt', '--files', 'b.txt']);

			expect(result.flags.files).toEqual(['a.txt', 'b.txt']);
		});

		it('should parse number array options', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					ports: { type: ['number'] },
				},
				args: {},
			});

			const result = await parser.init(['--ports', '8080', '--ports', '3000']);

			expect(result.flags.ports).toEqual([8080, 3000]);
		});

		it('should default to empty array when no values provided', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					tags: { type: ['string'] },
				},
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags.tags).toEqual([]);
		});

		it('should default to empty array when no values provided', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					tags: {
						type: ['string'],
						default: ['tag1', 'tag2'],
					},
				},
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags.tags).toEqual(['tag1', 'tag2']);
		});
	});

	describe('Variadic arguments', () => {
		it('should collect all remaining arguments as variadic', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {
					files: { type: ['string'], multiple: true },
				},
			});

			const result = await parser.init(['a.txt', 'b.txt', 'c.txt']);

			expect(result.args.files).toEqual(['a.txt', 'b.txt', 'c.txt']);
		});

		it('should handle variadic after regular arguments', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {
					command: { type: 'string' },
					args: { type: ['string'], multiple: true },
				},
			});

			const result = await parser.init(['run', 'arg1', 'arg2', 'arg3']);

			expect(result.args.command).toBe('run');
			expect(result.args.args).toEqual(['arg1', 'arg2', 'arg3']);
		});

		it('should default variadic to empty array when no values', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {
					files: { type: ['string'], multiple: true },
				},
			});

			const result = await parser.init([]);

			expect(result.args.files).toEqual([]);
		});
	});

	describe('Validation', () => {
		it('should validate required options that have no default', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					name: { type: 'string', required: false },
				},
				args: {},
			});

			// Set up parser state manually to test validate() method
			await parser.init([]);

			// Manually override to make it required for validate test

			(parser as any).flags.name.required = true;

			// validate() should check for required values
			await expect(parser.validate()).rejects.toThrow(MissingRequiredOptionValue);
		});

		it('should validate required arguments', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {
					file: { type: 'string', required: true },
				},
			}).disablePrompting();

			await parser.init([]);

			await expect(parser.validate()).rejects.toThrow(MissingRequiredArgumentValue);
		});

		it('should pass validation when all required values provided', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					name: { type: 'string', required: true },
				},
				args: {
					file: { type: 'string', required: true },
				},
			});

			await parser.init(['test.txt', '--name', 'value']);

			await expect(parser.validate()).resolves.toBeUndefined();
		});

		it('should throw InvalidOption for unknown options', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					verbose: { type: 'boolean' },
				},
				args: {},
			});

			await expect(parser.init(['--unknown'])).rejects.toThrow(InvalidOption);
		});

		it('should not throw on unknown options when allowUnknownOptions is set', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					verbose: { type: 'boolean' },
				},
				args: {},
			}).allowUnknownFlags();

			const result = await parser.init(['--verbose', '--unknown', 'value']);

			expect(result.flags.verbose).toBe(true);
			expect(result.flags).not.toHaveProperty('unknown');
		});
	});

	describe('Accessor methods', () => {
		it('should retrieve flag values', async () => {
			const parser = new CommandParser({
				io,
				flags: { verbose: { type: 'boolean' }, name: { type: 'string' } },
				args: {},
			});

			await parser.init(['--verbose', '--name', 'test']);

			expect(parser.flag('verbose')).toBe(true);
			expect(parser.flag('name')).toBe('test');
		});

		it('should retrieve argument values', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: { file: { type: 'string' }, count: { type: 'number' } },
			});

			await parser.init(['test.txt', '42']);

			expect(parser.argument('file')).toBe('test.txt');
			expect(parser.argument('count')).toBe(42);
		});

		it('should throw error when accessing options before init', () => {
			const parser = new CommandParser({
				io,
				flags: { verbose: { type: 'boolean' } },
				args: {},
			});

			expect(() => parser.flag('verbose')).toThrow('Options have not been parsed yet');
		});

		it('should throw error when accessing arguments before init', () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: { file: { type: 'string' } },
			});

			expect(() => parser.argument('file')).toThrow('Arguments have not been parsed yet');
		});

		describe('Runtime default values', () => {
			it('should return runtime default for empty array options', async () => {
				const parser = new CommandParser({
					io,
					flags: { tags: { type: ['string'] } },
					args: {},
				});

				await parser.init([]);

				expect(parser.flag('tags', ['default1', 'default2'])).toEqual(['default1', 'default2']);
			});

			it('should not use runtime default for non-empty array options', async () => {
				const parser = new CommandParser({
					io,
					flags: { tags: { type: ['string'] } },
					args: {},
				});

				await parser.init(['--tags', 'a', '--tags', 'b']);

				expect(parser.flag('tags', ['default1', 'default2'])).toEqual(['a', 'b']);
			});

			it('should not use runtime default for false boolean values', async () => {
				const parser = new CommandParser({
					io,
					flags: { flag: { type: 'boolean' } },
					args: {},
				});

				await parser.init([]);

				expect(parser.flag('flag', true)).toBe(false);
			});

			it('should not use runtime default for zero number values', async () => {
				const parser = new CommandParser({
					io,
					flags: { count: { type: 'number' } },
					args: {},
				});

				await parser.init(['--count', '0']);

				expect(parser.flag('count', 10)).toBe(0);
			});

			it('should not use runtime default for empty string values', async () => {
				const parser = new CommandParser({
					io,
					flags: { message: { type: 'string' } },
					args: {},
				});

				await parser.init(['--message', '']);

				expect(parser.flag('message', 'default')).toBe('');
			});

			it('should use runtime default for null values', async () => {
				const parser = new CommandParser({
					io,
					flags: { name: { type: 'string' } },
					args: {},
				});

				await parser.init([]);

				expect(parser.flag('name', 'default')).toBe('default');
			});

			it('should return runtime default for empty array arguments', async () => {
				const parser = new CommandParser({
					io,
					flags: {},
					args: { files: { type: ['string'], multiple: true } },
				});

				await parser.init([]);

				expect(parser.argument('files', ['default.txt'])).toEqual(['default.txt']);
			});

			it('should not use runtime default for non-empty array arguments', async () => {
				const parser = new CommandParser({
					io,
					flags: {},
					args: { files: { type: ['string'], multiple: true } },
				});

				await parser.init(['a.txt', 'b.txt']);

				expect(parser.argument('files', ['default.txt'])).toEqual(['a.txt', 'b.txt']);
			});
		});
	});

	describe('Metadata methods', () => {
		it('should return flag definitions', () => {
			const parser = new CommandParser({
				io,
				flags: {
					verbose: { type: 'boolean' },
					count: { type: 'number', default: 10 },
				},
				args: {},
			});

			const defs = parser.flagDefinitions();

			expect(defs.verbose.type).toBe('boolean');
			expect(defs.count.type).toBe('number');
			expect(defs.count.default).toBe(10);
		});

		it('should return argument definitions', () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {
					file: { type: 'string' },
					lines: { type: 'number', required: true },
				},
			});

			const defs = parser.argumentDefinitions();

			expect(defs.file.type).toBe('string');
			expect(defs.lines.type).toBe('number');
			expect(defs.lines.required).toBe(true);
		});

		it('should return available flag names', () => {
			const parser = new CommandParser({
				io,
				flags: { verbose: { type: 'boolean' }, output: { type: 'string' } },
				args: {},
			});

			const names = parser.availableFlags();

			expect(names).toEqual(['verbose', 'output']);
		});

		it('should return available argument names', () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: { file: { type: 'string' }, count: { type: 'number' } },
			});

			const names = parser.availableArguments();

			expect(names).toEqual(['file', 'count']);
		});
	});

	describe('Edge cases', () => {
		it('should handle empty string values', async () => {
			const parser = new CommandParser({
				io,
				flags: { message: { type: 'string' } },
				args: {},
			});

			const result = await parser.init(['--message', '']);

			expect(result.flags.message).toBe('');
		});

		it('should handle negative numbers with double dash', async () => {
			const parser = new CommandParser({
				io,
				flags: { offset: { type: 'number' } },
				args: {},
			});

			const result = await parser.init(['--', '--offset', '-42']);

			expect(result.flags.offset).toBeNull();
		});

		it('should handle floating point numbers', async () => {
			const parser = new CommandParser({
				io,
				flags: { ratio: { type: 'number' } },
				args: {},
			});

			const result = await parser.init(['--ratio', '3.14']);

			expect(result.flags.ratio).toBe(3.14);
		});

		it('should handle options with equals sign syntax', async () => {
			const parser = new CommandParser({
				io,
				flags: { name: { type: 'string' } },
				args: {},
			});

			const result = await parser.init(['--name=test']);

			expect(result.flags.name).toBe('test');
		});

		it('should handle mixed positional and flag ordering', async () => {
			const parser = new CommandParser({
				io,
				flags: { verbose: { type: 'boolean' } },
				args: { file: { type: 'string' }, lines: { type: 'number' } },
			});

			const result = await parser.init(['test.txt', '100', '--verbose']);

			expect(result.args.file).toBe('test.txt');
			expect(result.args.lines).toBe(100);
			expect(result.flags.verbose).toBe(true);
		});
	});

	describe('Strict mode', () => {
		it('should throw TooManyArguments when extra positional args are provided', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: { file: { type: 'string' } },
			}).strictMode();

			await expect(parser.init(['test.txt', 'extra1', 'extra2'])).rejects.toThrow(TooManyArguments);
		});

		it('should pass when exact number of arguments are provided', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: { file: { type: 'string' }, count: { type: 'number' } },
			}).strictMode();

			const result = await parser.init(['test.txt', '42']);

			expect(result.args.file).toBe('test.txt');
			expect(result.args.count).toBe(42);
		});

		it('should pass when fewer arguments are provided (missing args handled by validation)', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: { file: { type: 'string' }, count: { type: 'number' } },
			}).strictMode();

			const result = await parser.init(['test.txt']);

			expect(result.args.file).toBe('test.txt');
			expect(result.args.count).toBeNull();
		});

		it('should not reject extra args when strict mode is off', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: { file: { type: 'string' } },
			});

			const result = await parser.init(['test.txt', 'extra1', 'extra2']);

			expect(result.args.file).toBe('test.txt');
		});

		it('should not reject extra args consumed by variadic arguments', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {
					command: { type: 'string' },
					args: { type: ['string'], multiple: true },
				},
			}).strictMode();

			const result = await parser.init(['run', 'arg1', 'arg2']);

			expect(result.args.command).toBe('run');
			expect(result.args.args).toEqual(['arg1', 'arg2']);
		});
	});

	describe('Type conversion errors', () => {
		it('should handle invalid number conversion', async () => {
			const parser = new CommandParser({
				io,
				flags: { count: { type: 'number' } },
				args: {},
			});

			await expect(parser.init(['--count', 'not-a-number'])).rejects.toThrow(BadCommandFlag);
		});
	});

	describe('Extended types', () => {
		it('should parse enum flags', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					level: { type: 'enum', options: ['debug', 'info', 'warn'] as const },
				},
				args: {},
			});

			const result = await parser.init(['--level', 'info']);
			expect(result.flags.level).toBe('info');
		});

		it('should reject invalid enum value', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					level: { type: 'enum', options: ['debug', 'info'] as const },
				},
				args: {},
			});

			await expect(parser.init(['--level', 'error'])).rejects.toThrow(BadCommandFlag);
		});

		it('should default enum to null', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					level: { type: 'enum', options: ['debug', 'info'] as const },
				},
				args: {},
			});

			const result = await parser.init([]);
			expect(result.flags.level).toBeNull();
		});

		it('should parse number flags with min/max', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					port: { type: 'number', min: 1, max: 65535 },
				},
				args: {},
			});

			const result = await parser.init(['--port', '8080']);
			expect(result.flags.port).toBe(8080);
		});

		it('should reject number below min', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					port: { type: 'number', min: 1, max: 65535 },
				},
				args: {},
			});

			await expect(parser.init(['--port', '0'])).rejects.toThrow(BadCommandFlag);
		});

		it('should reject number above max', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					port: { type: 'number', min: 1, max: 65535 },
				},
				args: {},
			});

			await expect(parser.init(['--port', '70000'])).rejects.toThrow(BadCommandFlag);
		});

		it('should parse file flags as string', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					config: { type: 'file' },
				},
				args: {},
			});

			const result = await parser.init(['--config', '/etc/config.json']);
			expect(result.flags.config).toBe('/etc/config.json');
		});

		it('should parse directory flags as string', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					outDir: { type: 'directory' },
				},
				args: {},
			});

			const result = await parser.init(['--outDir', '/tmp/output']);
			expect(result.flags.outDir).toBe('/tmp/output');
		});

		it('should parse url flags as URL object', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					endpoint: { type: 'url' },
				},
				args: {},
			});

			const result = await parser.init(['--endpoint', 'https://api.example.com']);
			expect(result.flags.endpoint).toBeInstanceOf(URL);
			expect((result.flags.endpoint as any).href).toBe('https://api.example.com/');
		});

		it('should reject invalid url', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					endpoint: { type: 'url' },
				},
				args: {},
			});

			await expect(parser.init(['--endpoint', 'not-a-url'])).rejects.toThrow(BadCommandFlag);
		});

		it('should parse custom flags', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					since: { type: 'custom', parse: (v: string) => new Date(v) },
				},
				args: {},
			});

			const result = await parser.init(['--since', '2024-01-01']);
			expect(result.flags.since).toBeInstanceOf(Date);
		});

		it('should handle custom parse errors', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					value: {
						type: 'custom',
						parse: (_v: string) => {
							throw new Error('Bad input');
						},
					},
				},
				args: {},
			});

			await expect(parser.init(['--value', 'test'])).rejects.toThrow(BadCommandFlag);
		});

		it('should parse enum arguments', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {
					format: { type: 'enum', options: ['json', 'csv'] as const },
				},
			});

			const result = await parser.init(['json']);
			expect(result.args.format).toBe('json');
		});

		it('should parse file arguments', async () => {
			const parser = new CommandParser({
				io,
				flags: {},
				args: {
					input: { type: 'file' },
				},
			});

			const result = await parser.init(['/path/to/file.txt']);
			expect(result.args.input).toBe('/path/to/file.txt');
		});

		it('should validate file existence in validate()', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					config: { type: 'file', exists: true },
				},
				args: {},
			});

			await parser.init(['--config', '/nonexistent/file.txt']);

			await expect(parser.validate()).rejects.toThrow(BadCommandFlag);
		});

		it('should validate directory existence in validate()', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					outDir: { type: 'directory', exists: true },
				},
				args: {},
			});

			await parser.init(['--outDir', '/nonexistent/dir']);

			await expect(parser.validate()).rejects.toThrow(BadCommandFlag);
		});

		it('should validate custom validate function in validate()', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					since: {
						type: 'custom',
						parse: (v: string) => new Date(v),
						validate: (v: Date) => (isNaN(v.getTime()) ? 'Invalid date' : true),
					},
				},
				args: {},
			});

			await parser.init(['--since', 'not-a-date']);

			await expect(parser.validate()).rejects.toThrow(BadCommandFlag);
		});

		it('should pass custom validate for valid values', async () => {
			const parser = new CommandParser({
				io,
				flags: {
					since: {
						type: 'custom',
						parse: (v: string) => new Date(v),
						validate: (v: Date) => (isNaN(v.getTime()) ? 'Invalid date' : true),
					},
				},
				args: {},
			});

			await parser.init(['--since', '2024-01-01']);

			await expect(parser.validate()).resolves.toBeUndefined();
		});
	});
});
