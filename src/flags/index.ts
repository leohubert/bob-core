import { booleanFlag } from '@/src/flags/boolean.js';
import { custom } from '@/src/flags/custom.js';
import { directoryFlag } from '@/src/flags/directory.js';
import { fileFlag } from '@/src/flags/file.js';
import { numberFlag } from '@/src/flags/number.js';
import { optionFlag } from '@/src/flags/option.js';
import { stringFlag } from '@/src/flags/string.js';
import { urlFlag } from '@/src/flags/url.js';

/**
 * Flag builders used in `static flags = { ... }` schemas.
 *
 *   - `Flags.string({ secret? })` — text input; `secret` masks the prompt.
 *   - `Flags.number({ min?, max? })` — numeric input with range validation.
 *   - `Flags.boolean()` — toggle flag (`--debug` / `--no-debug`).
 *   - `Flags.option({ options: [...] as const })` — fixed enum.
 *   - `Flags.file({ exists? })` / `Flags.directory({ exists? })` — filesystem
 *     paths; `exists` validates presence at parse time.
 *   - `Flags.url()` — `URL`-typed input.
 *   - `Flags.custom<T>({ parse, ... })` — escape hatch for arbitrary types;
 *     `parse` is required.
 *
 * Every builder accepts the common `FlagProps` (description, alias, required,
 * default, multiple, ask, handler, help) plus its builder-specific extras.
 */
export const Flags = {
	string: stringFlag,
	number: numberFlag,
	boolean: booleanFlag,
	option: optionFlag,
	file: fileFlag,
	directory: directoryFlag,
	url: urlFlag,
	custom,
};

export { Args } from '@/src/args/index.js';
