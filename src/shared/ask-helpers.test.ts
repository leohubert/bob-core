import { describe, expect, it } from 'vitest';

import { ValidationError } from '@/src/errors/ValidationError.js';
import { flagOptsMock } from '@/src/fixtures.test.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition, FlagOpts } from '@/src/lib/types.js';
import { buildDirectoryAsk, buildFileAsk, buildNumberAsk, buildOptionAsk, buildStringAsk, buildUrlAsk } from '@/src/shared/ask-helpers.js';

function fakeUx(map: Partial<{ [K in keyof FlagOpts['ux']]: any }>): FlagOpts['ux'] {
	const ux: any = {};
	for (const k of ['askForInput', 'askForPassword', 'askForList', 'askForNumber', 'askForSelect', 'askForCheckbox', 'askForFile', 'askForDirectory']) {
		ux[k] = map[k as keyof typeof map] ?? (() => Promise.resolve(null));
	}
	return ux;
}

function defOf(builder: () => FlagDefinition<any, any>): FlagDefinition {
	return builder() as FlagDefinition;
}

describe('ask-helpers', () => {
	describe('buildStringAsk', () => {
		it('routes secret flags to askForPassword', async () => {
			let captured: any = null;
			const def = defOf(() => Flags.string({ secret: true, required: true })) as any;
			await buildStringAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForPassword: (_msg: string, opts: any) => {
							captured = opts;
							return Promise.resolve('pw');
						},
					}),
				}),
			);
			expect(captured).not.toBeNull();
			// validate function rejects empty required
			expect(captured.validate('')).toBe('This value is required');
			// validate accepts valid
			expect(captured.validate('hello')).toBe(true);
		});

		it('routes multiple flags to askForList with comma validator', async () => {
			let captured: any = null;
			const def = defOf(() => Flags.string({ multiple: true, required: true })) as any;
			await buildStringAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForList: (_msg: string, opts: any) => {
							captured = opts;
							return Promise.resolve(null);
						},
					}),
				}),
			);
			expect(captured.separator).toBe(',');
			expect(captured.validate('')).toBe('Please enter at least one value');
			expect(captured.validate('a,b,c')).toBe(true);
		});

		it('falls back to askForInput for plain string flags', async () => {
			let called = false;
			const def = defOf(() => Flags.string()) as any;
			await buildStringAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForInput: (_msg: string, opts: any) => {
							called = true;
							expect(opts.validate('anything')).toBe(true);
							return Promise.resolve('x');
						},
					}),
				}),
			);
			expect(called).toBe(true);
		});

		it('rethrows non-ValidationError thrown by parse (no silent "Invalid value")', async () => {
			const def: FlagDefinition = {
				type: 'custom',
				parse: () => {
					throw new TypeError('boom');
				},
			};
			let captured: any = null;
			await buildStringAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForInput: (_msg: string, opts: any) => {
							captured = opts;
							return Promise.resolve('x');
						},
					}),
				}),
			);
			expect(() => captured.validate('foo')).toThrow(TypeError);
		});

		it('returns ValidationError message when parse throws ValidationError', async () => {
			const def: FlagDefinition = {
				type: 'custom',
				parse: () => {
					throw new ValidationError('not a unicorn');
				},
			};
			let captured: any = null;
			await buildStringAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForInput: (_msg: string, opts: any) => {
							captured = opts;
							return Promise.resolve('x');
						},
					}),
				}),
			);
			expect(captured.validate('foo')).toBe('not a unicorn');
		});
	});

	describe('buildNumberAsk', () => {
		it('rejects required-empty input', async () => {
			let captured: any = null;
			const def = defOf(() => Flags.number({ required: true })) as any;
			await buildNumberAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForNumber: (_msg: string, opts: any) => {
							captured = opts;
							return Promise.resolve(null);
						},
					}),
				}),
			);
			expect(captured.validate(undefined)).toBe('This value is required');
			expect(captured.validate(42)).toBe(true);
		});

		it('rethrows non-ValidationError from parse', async () => {
			const def: FlagDefinition = {
				type: 'number',
				parse: () => {
					throw new TypeError('numbers are hard');
				},
			};
			let captured: any = null;
			await buildNumberAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForNumber: (_msg: string, opts: any) => {
							captured = opts;
							return Promise.resolve(null);
						},
					}),
				}),
			);
			expect(() => captured.validate(7)).toThrow(TypeError);
		});
	});

	describe('buildOptionAsk', () => {
		it('returns null when definition is not an option', async () => {
			const def = defOf(() => Flags.string()) as any;
			const result = await buildOptionAsk(flagOptsMock(def));
			expect(result).toBeNull();
		});

		it('routes single-value option to askForSelect with mapped choices', async () => {
			let capturedChoices: any = null;
			const def = defOf(() => Flags.option({ options: ['a', 'b'] as const })) as any;
			await buildOptionAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForSelect: (_msg: string, choices: any) => {
							capturedChoices = choices;
							return Promise.resolve('a');
						},
					}),
				}),
			);
			expect(capturedChoices).toEqual([
				{ name: 'a', value: 'a' },
				{ name: 'b', value: 'b' },
			]);
		});

		it('routes multiple-option to askForCheckbox', async () => {
			let used: 'select' | 'checkbox' | null = null;
			const def = defOf(() => Flags.option({ options: ['a', 'b'] as const, multiple: true }));
			await buildOptionAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForCheckbox: () => {
							used = 'checkbox';
							return Promise.resolve([]);
						},
						askForSelect: () => {
							used = 'select';
							return Promise.resolve(null);
						},
					}),
				}),
			);
			expect(used).toBe('checkbox');
		});
	});

	describe('buildFileAsk / buildDirectoryAsk', () => {
		it('passes basePath = cwd to file selector', async () => {
			let opts: any = null;
			const def = defOf(() => Flags.file()) as any;
			await buildFileAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForFile: (_msg: string, o: any) => {
							opts = o;
							return Promise.resolve(null);
						},
					}),
				}),
			);
			expect(opts.basePath).toBe(process.cwd());
		});

		it('passes basePath = cwd to directory selector', async () => {
			let opts: any = null;
			const def = defOf(() => Flags.directory()) as any;
			await buildDirectoryAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForDirectory: (_msg: string, o: any) => {
							opts = o;
							return Promise.resolve(null);
						},
					}),
				}),
			);
			expect(opts.basePath).toBe(process.cwd());
		});
	});

	describe('buildUrlAsk', () => {
		it('rejects malformed URLs through the validator', async () => {
			let captured: any = null;
			const def = defOf(() => Flags.url()) as any;
			await buildUrlAsk(
				flagOptsMock(def, {
					ux: fakeUx({
						askForInput: (_msg: string, opts: any) => {
							captured = opts;
							return Promise.resolve(null);
						},
					}),
				}),
			);
			expect(captured.validate('https://example.com')).toBe(true);
			const result = captured.validate('not-a-url');
			expect(typeof result).toBe('string');
			expect(result).toMatch(/Invalid URL/);
		});
	});
});
