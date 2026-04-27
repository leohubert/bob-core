/**
 * Raised by `parse`/`ask` validators to signal user-facing input problems.
 *
 * `safeParse` in {@link CommandParser} catches this specifically (and re-wraps
 * it as {@link BadCommandFlag} or {@link BadCommandArgument}) — anything else
 * is treated as a programmer bug and propagates unchanged.
 */
export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
	}
}
