/**
 * Minimal ANSI styling, replacing chalk. Detection runs per call so tests can flip
 * `FORCE_COLOR`/`NO_COLOR` without import-order games, and so a runtime without `process`
 * degrades to plain text instead of throwing.
 *
 * Precedence follows chalk: `FORCE_COLOR` wins, then `NO_COLOR` (any non-empty value
 * disables, per no-color.org), then whether stdout is a TTY.
 */
function colorEnabled(): boolean {
	const env = globalThis.process?.env ?? {};
	if (env.FORCE_COLOR !== undefined) {
		return env.FORCE_COLOR !== '0' && env.FORCE_COLOR !== 'false' && env.FORCE_COLOR !== '';
	}
	if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') {
		return false;
	}

	return globalThis.process?.stdout?.isTTY === true;
}

const style =
	(open: string, close: string) =>
	(text: string): string =>
		colorEnabled() ? `\x1b[${open}m${text}\x1b[${close}m` : text;

export const bold = style('1', '22');
export const dim = style('2', '22');
export const red = style('31', '39');
export const green = style('32', '39');
export const yellow = style('33', '39');
export const cyan = style('36', '39');
export const white = style('37', '39');
export const gray = style('90', '39');
