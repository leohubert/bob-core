export function newLoader(
	text = '',
	chars = ['\u2819', '\u2818', '\u2830', '\u2834', '\u2824', '\u2826', '\u2806', '\u2803', '\u280B', '\u2809'],
	delay = 100,
) {
	let loaderText = text;
	let previousText: string | null = null;
	let maxTextLength = text.length;
	let x = 0;

	const clearLines = (textLength: number) => {
		const cols = process.stdout.columns || 80;
		const totalWidth = textLength + 2; // spinner char + space
		const lines = Math.max(1, Math.ceil(totalWidth / cols));

		if (process.stdout.isTTY && process.stdout.clearLine && process.stdout.moveCursor) {
			if (lines > 1) process.stdout.moveCursor(0, -(lines - 1));
			for (let i = 0; i < lines; i++) {
				process.stdout.cursorTo(0);
				process.stdout.clearLine(1);
				if (i < lines - 1) process.stdout.moveCursor(0, 1);
			}
			if (lines > 1) process.stdout.moveCursor(0, -(lines - 1));
			process.stdout.cursorTo(0);
		} else {
			process.stdout.write('\r' + ' '.repeat(textLength + 5) + '\r');
		}
	};

	const interval = setInterval(function () {
		if (previousText !== null) {
			clearLines(Math.max(previousText.length, loaderText.length));
			previousText = null;
		}

		process.stdout.write('\r' + chars[x++] + ' ' + loaderText);
		x = x % chars.length;
	}, delay);

	const stop = () => {
		clearInterval(interval);
		clearLines(maxTextLength);
	};

	return {
		[Symbol.dispose]: stop,
		[Symbol.asyncDispose]: stop,
		updateText: (newText: string) => {
			previousText = loaderText;
			loaderText = newText;
			maxTextLength = Math.max(maxTextLength, newText.length);
		},
		stop,
	};
}
