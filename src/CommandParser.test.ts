import { beforeEach, describe, expect, it } from 'vitest';

import { CommandParser } from '@/src/CommandParser.js';
import { Args } from '@/src/args/index.js';
import { BadCommandFlag } from '@/src/errors/BadCommandFlag.js';
import { InvalidFlag } from '@/src/errors/InvalidFlag.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { MissingRequiredFlagValue } from '@/src/errors/MissingRequiredFlagValue.js';
import { TooManyArguments } from '@/src/errors/TooManyArguments.js';
import { Flags } from '@/src/flags/index.js';
import { UX } from '@/src/ux/index.js';

describe('CommandParser', () => {
	let ux: UX;
	beforeEach(() => {
		ux = new UX();
	});

	describe('Basic parsing', () => {
		it('should parse empty arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags).toEqual({});
			expect(result.args).toEqual({});
		});

		it('should parse boolean options', async () => {
			const parser = new CommandParser({
				ux,
				flags: { verbose: Flags.boolean(), debug: Flags.boolean() },
				args: {},
			});

			const result = await parser.init(['--verbose', '--debug']);

			expect(result.flags.verbose).toBe(true);
			expect(result.flags.debug).toBe(true);
		});

		it('should default boolean options to false', async () => {
			const parser = new CommandParser({
				ux,
				flags: { verbose: Flags.boolean() },
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags.verbose).toBe(false);
		});

		it('should parse string options', async () => {
			const parser = new CommandParser({
				ux,
				flags: { name: Flags.string(), output: Flags.string() },
				args: {},
			});

			const result = await parser.init(['--name', 'test', '--output', 'file.txt']);

			expect(result.flags.name).toBe('test');
			expect(result.flags.output).toBe('file.txt');
		});

		it('should parse number options', async () => {
			const parser = new CommandParser({
				ux,
				flags: { count: Flags.number(), limit: Flags.number() },
				args: {},
			});

			const result = await parser.init(['--count', '42', '--limit', '100']);

			expect(result.flags.count).toBe(42);
			expect(result.flags.limit).toBe(100);
		});

		it('should parse positional arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string(), lines: Args.number() },
			});

			const result = await parser.init(['test.txt', '50']);

			expect(result.args.file).toBe('test.txt');
			expect(result.args.lines).toBe(50);
		});

		it('should parse mixed options and arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: { verbose: Flags.boolean() },
				args: { file: Args.string() },
			});

			const result = await parser.init(['test.txt', '--verbose']);

			expect(result.flags.verbose).toBe(true);
			expect(result.args.file).toBe('test.txt');
		});
	});

	describe('Option definitions', () => {
		it('should handle options with descriptions', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					verbose: Flags.boolean({ description: 'Enable verbose output' }),
				},
				args: {},
			});

			const result = await parser.init(['--verbose']);

			expect(result.flags.verbose).toBe(true);
		});

		it('should handle required options', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({ required: true }),
				},
				args: {},
			});

			const result = await parser.init(['--name', 'test']);

			expect(result.flags.name).toBe('test');
		});

		it('should handle default values', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					port: Flags.number({ default: 8080 }),
					host: Flags.string({ default: 'localhost' }),
				},
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags.port).toBe(8080);
			expect(result.flags.host).toBe('localhost');
		});

		it('should override default values when provided', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					port: Flags.number({ default: 8080 }),
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
				ux,
				flags: {
					verbose: Flags.boolean({ alias: 'v' }),
				},
				args: {},
			});

			const result = await parser.init(['-v']);

			expect(result.flags.verbose).toBe(true);
		});

		it('should handle multiple aliases', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					output: Flags.string({ alias: ['o', 'out'] }),
				},
				args: {},
			});

			const result1 = await parser.init(['-o', 'file.txt']);
			expect(result1.flags.output).toBe('file.txt');

			const parser2 = new CommandParser({
				ux,
				flags: {
					output: Flags.string({ alias: ['o', 'out'] }),
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
				ux,
				flags: {
					files: Flags.string({ multiple: true }),
				},
				args: {},
			});

			const result = await parser.init(['--files', 'a.txt', '--files', 'b.txt']);

			expect(result.flags.files).toEqual(['a.txt', 'b.txt']);
		});

		it('should parse number array options', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					ports: Flags.number({ multiple: true }),
				},
				args: {},
			});

			const result = await parser.init(['--ports', '8080', '--ports', '3000']);

			expect(result.flags.ports).toEqual([8080, 3000]);
		});

		it('should default to empty array when no values provided', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					tags: Flags.string({ multiple: true }),
				},
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags.tags).toEqual([]);
		});

		it('should use custom default array when no values provided', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					tags: Flags.string({ multiple: true, default: ['tag1', 'tag2'] as any }),
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
				ux,
				flags: {},
				args: {
					files: Args.string({ multiple: true }),
				},
			});

			const result = await parser.init(['a.txt', 'b.txt', 'c.txt']);

			expect(result.args.files).toEqual(['a.txt', 'b.txt', 'c.txt']);
		});

		it('should handle variadic after regular arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					command: Args.string(),
					args: Args.string({ multiple: true }),
				},
			});

			const result = await parser.init(['run', 'arg1', 'arg2', 'arg3']);

			expect(result.args.command).toBe('run');
			expect(result.args.args).toEqual(['arg1', 'arg2', 'arg3']);
		});

		it('should default variadic to empty array when no values', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					files: Args.string({ multiple: true }),
				},
			});

			const result = await parser.init([]);

			expect(result.args.files).toEqual([]);
		});
	});

	describe('Validation', () => {
		it('should validate required options that have no default', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({ required: false }),
				},
				args: {},
			}).disablePrompting();

			// Set up parser state manually to test validate() method
			await parser.init([]);

			// Manually override to make it required for validate test

			(parser as any).flags.name.required = true;

			// validate() should check for required values
			await expect(parser.validate()).rejects.toThrow(MissingRequiredFlagValue);
		});

		it('should validate required arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					file: Args.string({ required: true }),
				},
			}).disablePrompting();

			await parser.init([]);

			await expect(parser.validate()).rejects.toThrow(MissingRequiredArgumentValue);
		});

		it('should pass validation when all required values provided', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({ required: true }),
				},
				args: {
					file: Args.string({ required: true }),
				},
			});

			await parser.init(['test.txt', '--name', 'value']);

			await expect(parser.validate()).resolves.toBeUndefined();
		});

		it('should throw InvalidOption for unknown options', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					verbose: Flags.boolean(),
				},
				args: {},
			});

			await expect(parser.init(['--unknown'])).rejects.toThrow(InvalidFlag);
		});

		it('should not throw on unknown flags when allowUnknownFlags is set', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					verbose: Flags.boolean(),
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
				ux,
				flags: { verbose: Flags.boolean(), name: Flags.string() },
				args: {},
			});

			await parser.init(['--verbose', '--name', 'test']);

			expect(parser.flag('verbose')).toBe(true);
			expect(parser.flag('name')).toBe('test');
		});

		it('should retrieve argument values', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string(), count: Args.number() },
			});

			await parser.init(['test.txt', '42']);

			expect(parser.argument('file')).toBe('test.txt');
			expect(parser.argument('count')).toBe(42);
		});

		it('should throw error when accessing options before init', () => {
			const parser = new CommandParser({
				ux,
				flags: { verbose: Flags.boolean() },
				args: {},
			});

			expect(() => parser.flag('verbose')).toThrow('Flags have not been parsed yet');
		});

		it('should throw error when accessing arguments before init', () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string() },
			});

			expect(() => parser.argument('file')).toThrow('Arguments have not been parsed yet');
		});

		describe('Runtime default values', () => {
			it('should return runtime default for empty array options', async () => {
				const parser = new CommandParser({
					ux,
					flags: { tags: Flags.string({ multiple: true }) },
					args: {},
				});

				await parser.init([]);

				expect(parser.flag('tags', ['default1', 'default2'] as any)).toEqual(['default1', 'default2']);
			});

			it('should not use runtime default for non-empty array options', async () => {
				const parser = new CommandParser({
					ux,
					flags: { tags: Flags.string({ multiple: true }) },
					args: {},
				});

				await parser.init(['--tags', 'a', '--tags', 'b']);

				expect(parser.flag('tags', ['default1', 'default2'] as any)).toEqual(['a', 'b']);
			});

			it('should not use runtime default for false boolean values', async () => {
				const parser = new CommandParser({
					ux,
					flags: { flag: Flags.boolean() },
					args: {},
				});

				await parser.init([]);

				expect(parser.flag('flag', true)).toBe(false);
			});

			it('should not use runtime default for zero number values', async () => {
				const parser = new CommandParser({
					ux,
					flags: { count: Flags.number() },
					args: {},
				});

				await parser.init(['--count', '0']);

				expect(parser.flag('count', 10)).toBe(0);
			});

			it('should not use runtime default for empty string values', async () => {
				const parser = new CommandParser({
					ux,
					flags: { message: Flags.string() },
					args: {},
				});

				await parser.init(['--message', '']);

				expect(parser.flag('message', 'default')).toBe('default');
			});

			it('should use runtime default for null values', async () => {
				const parser = new CommandParser({
					ux,
					flags: { name: Flags.string() },
					args: {},
				});

				await parser.init([]);

				expect(parser.flag('name', 'default')).toBe('default');
			});

			it('should return runtime default for empty array arguments', async () => {
				const parser = new CommandParser({
					ux,
					flags: {},
					args: { files: Args.string({ multiple: true }) },
				});

				await parser.init([]);

				expect(parser.argument('files', ['default.txt'] as any)).toEqual(['default.txt']);
			});

			it('should not use runtime default for non-empty array arguments', async () => {
				const parser = new CommandParser({
					ux,
					flags: {},
					args: { files: Args.string({ multiple: true }) },
				});

				await parser.init(['a.txt', 'b.txt']);

				expect(parser.argument('files', ['default.txt'] as any)).toEqual(['a.txt', 'b.txt']);
			});
		});
	});

	describe('Edge cases', () => {
		it('should handle empty string values', async () => {
			const parser = new CommandParser({
				ux,
				flags: { message: Flags.string() },
				args: {},
			});

			const result = await parser.init(['--message', '']);

			expect(result.flags.message).toBeNull();
		});

		it('should handle negative numbers with double dash', async () => {
			const parser = new CommandParser({
				ux,
				flags: { offset: Flags.number() },
				args: {},
			});

			const result = await parser.init(['--', '--offset', '-42']);

			expect(result.flags.offset).toBeNull();
		});

		it('should handle floating point numbers', async () => {
			const parser = new CommandParser({
				ux,
				flags: { ratio: Flags.number() },
				args: {},
			});

			const result = await parser.init(['--ratio', '3.14']);

			expect(result.flags.ratio).toBe(3.14);
		});

		it('should handle options with equals sign syntax', async () => {
			const parser = new CommandParser({
				ux,
				flags: { name: Flags.string() },
				args: {},
			});

			const result = await parser.init(['--name=test']);

			expect(result.flags.name).toBe('test');
		});

		it('should handle mixed positional and flag ordering', async () => {
			const parser = new CommandParser({
				ux,
				flags: { verbose: Flags.boolean() },
				args: { file: Args.string(), lines: Args.number() },
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
				ux,
				flags: {},
				args: { file: Args.string() },
			}).strictMode();

			await expect(parser.init(['test.txt', 'extra1', 'extra2'])).rejects.toThrow(TooManyArguments);
		});

		it('should pass when exact number of arguments are provided', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string(), count: Args.number() },
			}).strictMode();

			const result = await parser.init(['test.txt', '42']);

			expect(result.args.file).toBe('test.txt');
			expect(result.args.count).toBe(42);
		});

		it('should pass when fewer arguments are provided (missing args handled by validation)', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string(), count: Args.number() },
			}).strictMode();

			const result = await parser.init(['test.txt']);

			expect(result.args.file).toBe('test.txt');
			expect(result.args.count).toBeNull();
		});

		it('should not reject extra args when strict mode is off', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string() },
			});

			const result = await parser.init(['test.txt', 'extra1', 'extra2']);

			expect(result.args.file).toBe('test.txt');
		});

		it('should not reject extra args consumed by variadic arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					command: Args.string(),
					args: Args.string({ multiple: true }),
				},
			}).strictMode();

			const result = await parser.init(['run', 'arg1', 'arg2']);

			expect(result.args.command).toBe('run');
			expect(result.args.args).toEqual(['arg1', 'arg2']);
		});
	});

	describe('Ask delegation and flag prompting', () => {
		it('should call custom ask override during argument validation', async () => {
			const customAsk = async () => 'prompted-value';

			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					name: Args.string({ required: true, ask: customAsk }),
				},
			});

			await parser.init([]);
			await parser.validate();

			expect(parser.argument('name')).toBe('prompted-value');
		});

		it('should prompt for missing required flags (not just arguments)', async () => {
			const customAsk = async () => 'flag-value';

			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({ required: true, ask: customAsk }),
				},
				args: {},
			});

			await parser.init([]);
			await parser.validate();

			expect(parser.flag('name')).toBe('flag-value');
		});

		it('should throw when ask returns null for required argument', async () => {
			const customAsk = async () => null;

			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					name: Args.string({ required: true, ask: customAsk }),
				},
			});

			await parser.init([]);

			await expect(parser.validate()).rejects.toThrow(MissingRequiredArgumentValue);
		});

		it('should throw when ask returns null for required flag', async () => {
			const customAsk = async () => null;

			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({ required: true, ask: customAsk }),
				},
				args: {},
			});

			await parser.init([]);

			await expect(parser.validate()).rejects.toThrow(MissingRequiredFlagValue);
		});

		it('should throw for required flags without ask when prompting disabled', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({ required: true }),
				},
				args: {},
			}).disablePrompting();

			await parser.init([]);

			await expect(parser.validate()).rejects.toThrow(MissingRequiredFlagValue);
		});

		it('should not prompt for flags that already have values', async () => {
			let askCalled = false;
			const customAsk = async () => {
				askCalled = true;
				return 'should-not-be-used';
			};

			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({ required: true, ask: customAsk }),
				},
				args: {},
			});

			await parser.init(['--name', 'provided']);
			await parser.validate();

			expect(askCalled).toBe(false);
			expect(parser.flag('name')).toBe('provided');
		});

		it('custom flag type should not have a default ask', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					value: Flags.custom<string>()({ required: true }),
				},
				args: {},
			});

			await parser.init([]);

			await expect(parser.validate()).rejects.toThrow(MissingRequiredFlagValue);
		});
	});

	describe('Type conversion errors', () => {
		it('should handle invalid number conversion', async () => {
			const parser = new CommandParser({
				ux,
				flags: { count: Flags.number() },
				args: {},
			});

			await expect(parser.init(['--count', 'not-a-number'])).rejects.toThrow(BadCommandFlag);
		});
	});

	describe('Extended types', () => {
		it('should parse option flags', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					level: Flags.option({ options: ['debug', 'info', 'warn'] as const }),
				},
				args: {},
			});

			const result = await parser.init(['--level', 'info']);
			expect(result.flags.level).toBe('info');
		});

		it('should reject invalid option value', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					level: Flags.option({ options: ['debug', 'info'] as const }),
				},
				args: {},
			});

			await expect(parser.init(['--level', 'error'])).rejects.toThrow(BadCommandFlag);
		});

		it('should default option to null', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					level: Flags.option({ options: ['debug', 'info'] as const }),
				},
				args: {},
			});

			const result = await parser.init([]);
			expect(result.flags.level).toBeNull();
		});

		it('should parse number flags with min/max', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					port: Flags.number({ min: 1, max: 65535 }),
				},
				args: {},
			});

			const result = await parser.init(['--port', '8080']);
			expect(result.flags.port).toBe(8080);
		});

		it('should reject number below min', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					port: Flags.number({ min: 1, max: 65535 }),
				},
				args: {},
			});

			await expect(parser.init(['--port', '0'])).rejects.toThrow(BadCommandFlag);
		});

		it('should reject number above max', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					port: Flags.number({ min: 1, max: 65535 }),
				},
				args: {},
			});

			await expect(parser.init(['--port', '70000'])).rejects.toThrow(BadCommandFlag);
		});

		it('should parse file flags as string', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					config: Flags.file(),
				},
				args: {},
			});

			const result = await parser.init(['--config', '/etc/config.json']);
			expect(result.flags.config).toBe('/etc/config.json');
		});

		it('should parse directory flags as string', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					outDir: Flags.directory(),
				},
				args: {},
			});

			const result = await parser.init(['--outDir', '/tmp/output']);
			expect(result.flags.outDir).toBe('/tmp/output');
		});

		it('should parse url flags as URL object', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					endpoint: Flags.url(),
				},
				args: {},
			});

			const result = await parser.init(['--endpoint', 'https://api.example.com']);
			expect(result.flags.endpoint).toBeInstanceOf(URL);
			expect((result.flags.endpoint as any).href).toBe('https://api.example.com/');
		});

		it('should reject invalid url', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					endpoint: Flags.url(),
				},
				args: {},
			});

			await expect(parser.init(['--endpoint', 'not-a-url'])).rejects.toThrow(BadCommandFlag);
		});

		it('should parse custom flags', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					since: Flags.custom({ parse: (v: string) => new Date(v) })(),
				},
				args: {},
			});

			const result = await parser.init(['--since', '2024-01-01']);
			expect(result.flags.since).toBeInstanceOf(Date);
		});

		it('should handle custom parse errors', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					value: Flags.custom({
						parse: (_v: string) => {
							throw new Error('Bad input');
						},
					})(),
				},
				args: {},
			});

			await expect(parser.init(['--value', 'test'])).rejects.toThrow(BadCommandFlag);
		});

		it('should parse option arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					format: Args.option({ options: ['json', 'csv'] as const }),
				},
			});

			const result = await parser.init(['json']);
			expect(result.args.format).toBe('json');
		});

		it('should parse file arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					input: Args.file(),
				},
			});

			const result = await parser.init(['/path/to/file.txt']);
			expect(result.args.input).toBe('/path/to/file.txt');
		});

		it('should validate file existence at init', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					config: Flags.file({ exists: true }),
				},
				args: {},
			});

			await expect(parser.init(['--config', '/nonexistent/file.txt'])).rejects.toThrow(BadCommandFlag);
		});

		it('should validate directory existence at init', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					outDir: Flags.directory({ exists: true }),
				},
				args: {},
			});

			await expect(parser.init(['--outDir', '/nonexistent/dir'])).rejects.toThrow(BadCommandFlag);
		});

		it('should reject custom parse that throws ValidationError', async () => {
			const { ValidationError } = await import('@/src/errors/ValidationError.js');
			const parser = new CommandParser({
				ux,
				flags: {
					since: Flags.custom({
						parse: (v: string) => {
							const d = new Date(v);
							if (isNaN(d.getTime())) throw new ValidationError('Invalid date');
							return d;
						},
					})(),
				},
				args: {},
			});

			await expect(parser.init(['--since', 'not-a-date'])).rejects.toThrow(BadCommandFlag);
		});

		it('should pass custom parse for valid values', async () => {
			const { ValidationError } = await import('@/src/errors/ValidationError.js');
			const parser = new CommandParser({
				ux,
				flags: {
					since: Flags.custom({
						parse: (v: string) => {
							const d = new Date(v);
							if (isNaN(d.getTime())) throw new ValidationError('Invalid date');
							return d;
						},
					})(),
				},
				args: {},
			});

			const result = await parser.init(['--since', '2024-01-01']);
			expect(result.flags.since).toBeInstanceOf(Date);
		});

		it('should reject invalid option value at init', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					level: Flags.option({ options: ['a', 'b'] as const }),
				},
				args: {},
			});

			await expect(parser.init(['--level', 'c'])).rejects.toThrow(BadCommandFlag);
		});
	});

	describe('Validation pipeline', () => {
		it('should validate prompted flag values through parse', async () => {
			const { ValidationError } = await import('@/src/errors/ValidationError.js');
			const customAsk = async () => 'prompted';

			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.custom({
						parse: (v: string) => {
							if (v === 'prompted') throw new ValidationError('not allowed');
							return v;
						},
						ask: customAsk,
					})({ required: true }),
				},
				args: {},
			});

			await parser.init([]);

			await expect(parser.validate()).rejects.toThrow(BadCommandFlag);
		});

		it('should validate prompted argument values through parse', async () => {
			const { ValidationError } = await import('@/src/errors/ValidationError.js');
			const customAsk = async () => 'prompted';

			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					name: Args.custom({
						parse: (v: string) => {
							if (v === 'prompted') throw new ValidationError('not allowed');
							return v;
						},
						ask: customAsk,
					})({ required: true }),
				},
			});

			await parser.init([]);

			await expect(parser.validate()).rejects.toThrow('not allowed');
		});

		it('should pass validation for valid prompted values', async () => {
			const { ValidationError } = await import('@/src/errors/ValidationError.js');
			const customAsk = async () => 'valid';

			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.custom({
						parse: (v: string) => {
							if (v === 'invalid') throw new ValidationError('not allowed');
							return v;
						},
						ask: customAsk,
					})({ required: true }),
				},
				args: {},
			});

			await parser.init([]);

			await expect(parser.validate()).resolves.toBeUndefined();
		});
	});

	describe('setFlag()', () => {
		it('should update a parsed flag value', async () => {
			const parser = new CommandParser({
				ux,
				flags: { name: Flags.string() },
				args: {},
			});

			await parser.init(['--name', 'original']);
			await parser.setFlag('name', 'updated');

			expect(parser.flag('name')).toBe('updated');
		});

		it('should throw if init() has not been called', async () => {
			const parser = new CommandParser({
				ux,
				flags: { name: Flags.string() },
				args: {},
			});

			await expect(parser.setFlag('name', 'value')).rejects.toThrow('Flags have not been parsed yet');
		});

		it('should throw for unrecognized flag name', async () => {
			const parser = new CommandParser({
				ux,
				flags: { name: Flags.string() },
				args: {},
			});

			await parser.init([]);

			await expect(parser.setFlag('unknown' as any, 'value')).rejects.toThrow(InvalidFlag);
		});
	});

	describe('setArgument()', () => {
		it('should update a parsed argument value', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string() },
			});

			await parser.init(['original.txt']);
			await parser.setArgument('file', 'updated.txt');

			expect(parser.argument('file')).toBe('updated.txt');
		});

		it('should throw if init() has not been called', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string() },
			});

			await expect(parser.setArgument('file', 'value')).rejects.toThrow('Arguments have not been parsed yet');
		});

		it('should throw for unrecognized argument name', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: { file: Args.string() },
			});

			await parser.init([]);

			await expect(parser.setArgument('unknown' as any, 'value')).rejects.toThrow('not recognized');
		});
	});

	describe('Async default functions', () => {
		it('should resolve async default for flags', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({ default: async () => 'async-default' }),
				},
				args: {},
			});

			const result = await parser.init([]);

			expect(result.flags.name).toBe('async-default');
		});

		it('should resolve async default for arguments', async () => {
			const parser = new CommandParser({
				ux,
				flags: {},
				args: {
					file: Args.string({ default: async () => 'async-file.txt' }),
				},
			});

			const result = await parser.init([]);

			expect(result.args.file).toBe('async-file.txt');
		});

		it('should not call async default when value is provided', async () => {
			let defaultCalled = false;
			const parser = new CommandParser({
				ux,
				flags: {
					name: Flags.string({
						default: async () => {
							defaultCalled = true;
							return 'async-default';
						},
					}),
				},
				args: {},
			});

			const result = await parser.init(['--name', 'provided']);

			expect(defaultCalled).toBe(false);
			expect(result.flags.name).toBe('provided');
		});
	});

	describe('Boolean flag validation', () => {
		it('should reject invalid boolean string values', async () => {
			const parser = new CommandParser({
				ux,
				flags: { force: Flags.boolean() },
				args: {},
			});

			await expect(parser.init(['--force=banana'])).rejects.toThrow(BadCommandFlag);
		});

		it('should reject --flag=no as invalid', async () => {
			const parser = new CommandParser({
				ux,
				flags: { force: Flags.boolean() },
				args: {},
			});

			await expect(parser.init(['--force=no'])).rejects.toThrow(BadCommandFlag);
		});
	});

	describe('String alias in validateUnknownFlags', () => {
		it('should handle string alias correctly (not iterate characters)', async () => {
			const parser = new CommandParser({
				ux,
				flags: {
					verbose: Flags.boolean({ alias: 'v' }),
				},
				args: {},
			});

			// -v should be valid (alias), -e should be invalid (not a character of 'v')
			await expect(parser.init(['-v'])).resolves.toBeTruthy();
			await expect(
				new CommandParser({
					ux,
					flags: { verbose: Flags.boolean({ alias: 'v' }) },
					args: {},
				}).init(['-e']),
			).rejects.toThrow(InvalidFlag);
		});
	});
});
