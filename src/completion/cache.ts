import fs from 'node:fs';

import { CommandSpec } from '@/src/completion/specs.js';

export type CompletionCacheOptions = {
	/**
	 * Where the snapshot lives. Use an absolute path — a relative one resolves against whatever
	 * directory the user happened to be in when they pressed TAB.
	 */
	file: string;
	/**
	 * Invalidation key, typically a build hash or version string. A mismatch discards the snapshot,
	 * so a rebuild refreshes completion for free. Omit the cache entirely in a dev setup where the
	 * key does not change as commands are edited.
	 */
	version: string;
};

type Snapshot = {
	version: string;
	specs: CommandSpec[];
};

/**
 * A metadata snapshot of every command, so a keypress does not have to import them.
 *
 * A command's name lives in its class, not its filename, so discovering commands means importing
 * every command module — far too slow to sit behind TAB once a CLI has a few dozen. None of the
 * metadata completion needs can change between builds, which is what makes it cacheable.
 *
 * Every failure here is swallowed: a cache that cannot be read or written is a performance problem,
 * never a correctness one.
 */
export function readSpecCache(opts: CompletionCacheOptions): CommandSpec[] | null {
	try {
		const snapshot = JSON.parse(fs.readFileSync(opts.file, 'utf8')) as Snapshot;

		return snapshot.version === opts.version ? snapshot.specs : null;
	} catch {
		return null;
	}
}

/** Written via a temp file and rename, so a half-written snapshot is never read back. */
export function writeSpecCache(opts: CompletionCacheOptions, specs: CommandSpec[]): void {
	const temp = `${opts.file}.tmp`;

	try {
		fs.writeFileSync(temp, JSON.stringify({ version: opts.version, specs } satisfies Snapshot));
		fs.renameSync(temp, opts.file);
	} catch {
		// See the docblock above: a cache we cannot write is not an error worth surfacing.
	}
}
