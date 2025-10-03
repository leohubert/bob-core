import {Mocked, vi} from 'vitest';
import {Logger} from '@/src/Logger.js';
import {LoggerContract} from "@/src/contracts/index.js";

export type TestLogger = Mocked<Logger>;
export function newTestLogger(): TestLogger {
	return {
		log: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		verbose: vi.fn(),
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
