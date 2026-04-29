import { Mocked, vi } from 'vitest';

import { Command } from '@/src/Command.js';
import { Logger } from '@/src/Logger.js';
import { LoggerContract } from '@/src/contracts/index.js';
import type { FlagDefinition, FlagOpts } from '@/src/lib/types.js';
import { UX } from '@/src/ux/index.js';

export type TestLogger = Mocked<Logger>;
export function newTestLogger(): TestLogger {
	return {
		log: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		setLevel: vi.fn(),
		getLevel: vi.fn().mockReturnValue('info'),
	} satisfies LoggerContract as unknown as TestLogger;
}

/**
 * Creates test fixtures with a mocked logger
 * @returns Object containing mocked logger instance
 */
export function newFixtures() {
	return {
		logger: newTestLogger(),
	};
}

export function flagOptsMock(definition: FlagDefinition<any, any>, overrides?: Partial<FlagOpts>): FlagOpts<any, any> {
	return {
		name: 'test',
		ux: new UX(),
		ctx: undefined,
		definition,
		cmd: Command,
		...overrides,
	};
}

export function argOptsMock(definition: FlagDefinition<any, any>, overrides?: Partial<FlagOpts>): FlagOpts<any, any> {
	return {
		name: 'test',
		ux: new UX(),
		ctx: undefined,
		definition,
		cmd: Command,
		...overrides,
	};
}
