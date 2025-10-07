import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExceptionHandler } from '@/src/ExceptionHandler.js';
import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';
import { newTestLogger } from '@/src/testFixtures.js';

class TestBobError extends BobError {
	constructor(message: string) {
		super(message);
	}

	pretty(logger: Logger): void {
		logger.error('Pretty error: ' + this.message);
	}
}

describe('ExceptionHandler', () => {
	let mockLogger: Logger;
	let handler: ExceptionHandler;

	beforeEach(() => {
		mockLogger = newTestLogger();

		handler = new ExceptionHandler(mockLogger);
	});

	describe('BobError handling', () => {
		it('should call pretty() on BobError with logger', () => {
			const error = new TestBobError('test error');
			const prettySpy = vi.spyOn(error, 'pretty');

			handler.handle(error);

			expect(prettySpy).toHaveBeenCalledWith(mockLogger);
		});

		it('should return -1 for BobError', () => {
			const error = new TestBobError('test error');
			const result = handler.handle(error);

			expect(result).toBe(-1);
		});

		it('should execute pretty() method', () => {
			const error = new TestBobError('test error');

			handler.handle(error);

			expect(mockLogger.error).toHaveBeenCalledWith('Pretty error: test error');
		});
	});

	describe('Regular Error handling', () => {
		it('should rethrow non-BobError', () => {
			const error = new Error('regular error');

			expect(() => handler.handle(error)).toThrow('regular error');
		});

		it('should rethrow TypeError', () => {
			const error = new TypeError('type error');

			expect(() => handler.handle(error)).toThrow(TypeError);
		});

		it('should rethrow ReferenceError', () => {
			const error = new ReferenceError('reference error');

			expect(() => handler.handle(error)).toThrow(ReferenceError);
		});
	});

	describe('Logger injection', () => {
		it('should use provided logger', () => {
			const customLogger = {
				log: vi.fn(),
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
				verbose: vi.fn(),
			} as any;

			const customHandler = new ExceptionHandler(customLogger);
			const error = new TestBobError('test');

			customHandler.handle(error);

			expect(customLogger.error).toHaveBeenCalledWith('Pretty error: test');
		});
	});

	describe('Error types', () => {
		it('should correctly identify BobError instances', () => {
			const bobError = new TestBobError('bob error');
			const regularError = new Error('regular error');

			expect(() => handler.handle(regularError)).toThrow();
			expect(handler.handle(bobError)).toBe(-1);
		});
	});
});
