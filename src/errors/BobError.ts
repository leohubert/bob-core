import type { LoggerContract } from '@/src/contracts/index.js';

/**
 * Base class for every framework-recognised error.
 *
 * Subclasses are expected to override `$type` with their own literal so the
 * field doubles as a discriminator (useful for telemetry and structured logs).
 * `pretty` renders the error to a {@link LoggerContract}; the dispatch is wired
 * up in {@link ExceptionHandler}.
 */
export abstract class BobError extends Error {
	abstract readonly $type: string;

	abstract pretty(logger: LoggerContract): void;
}
