import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandIO, CommandIOOptions } from '@/src/CommandIO.js';
import { CommandWithSignature } from '@/src/CommandWithSignature.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { TestLogger, newTestLogger } from '@/src/fixtures.test.js';
import { Parsed } from '@/src/lib/types.js';

class MockCommand extends CommandWithSignature {
	static override signature = 'mockCommand {argument} {--option}';
	static override description = 'This is a mock command for testing';

	protected newCommandIO(opts: CommandIOOptions): CommandIO {
		return vi.mockObject(new CommandIO(opts));
	}

	async handle(_ctx: any, { flags, args }: Parsed<any>): Promise<number | void> {
		if (flags.option) {
			return 11;
		}

		if (args.argument === 'value') {
			return 1;
		} else if (args.argument) {
			return -1;
		}

		return 0;
	}
}

describe('CommandWithSignature', () => {
	let command: MockCommand;
	let logger: TestLogger;

	beforeEach(() => {
		logger = newTestLogger();
		command = new MockCommand();
	});

	it('should derive command name from signature', () => {
		expect((MockCommand as any).command).toBe('mockCommand');
	});

	it('should have a description', () => {
		expect(MockCommand.description).toBe('This is a mock command for testing');
	});

	it('should handle command with argument', async () => {
		const result = await command.run({
			ctx: {},
			logger: logger,
			args: ['value'],
		});
		expect(result).toBe(1);
	});

	it('should handle command with bad argument', async () => {
		const result = await command.run({
			ctx: {},
			logger: logger,
			args: ['badValue'],
		});
		expect(result).toBe(-1);
	});

	it('should throw error if argument is missing', async () => {
		await expect(
			command.run({
				ctx: {},
				logger: logger,
				args: [],
			}),
		).rejects.toThrowError(MissingRequiredArgumentValue);
	});

	it('should handle command with option', async () => {
		const result = await command.run({
			ctx: {},
			logger: logger,
			args: ['value', '--option'],
		});
		expect(result).toBe(11);
	});
});
