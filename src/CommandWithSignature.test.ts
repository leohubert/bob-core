import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandIO, CommandIOOptions } from '@/src/CommandIO.js';
import { CommandWithSignature } from '@/src/CommandWithSignature.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { TestLogger, newTestLogger } from '@/src/fixtures.test.js';

class MockCommand extends CommandWithSignature {
	signature = 'mockCommand {argument} {--option}';
	description = 'This is a mock command for testing';

	protected newCommandIO(opts: CommandIOOptions): CommandIO {
		return vi.mockObject(new CommandIO(opts));
	}

	async handle(): Promise<number | void> {
		const opts = this.option('option');
		const arg = this.argument('argument');

		if (opts) {
			return 11;
		}

		if (arg === 'value') {
			return 1;
		} else if (arg) {
			return -1;
		}

		return 0;
	}
}

describe('Command', () => {
	let command: MockCommand;
	let logger: TestLogger;

	beforeEach(() => {
		logger = newTestLogger();
		command = new MockCommand();
	});

	it('should have a command', () => {
		expect(command.command).toBe('mockCommand');
	});

	it('should have a signature', () => {
		expect(command.signature).toBe('mockCommand {argument} {--option}');
	});

	it('should have a description', () => {
		expect(command.description).toBe('This is a mock command for testing');
	});

	it('should handle command with argument', async () => {
		const result = await command.run({
			ctx: {},
			logger: logger,
			args: ['value'],
		});
		expect(result).toBe(1);
	});

	it('should handle command with argument', async () => {
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
