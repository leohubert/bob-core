export function newLoader(
	text = '',
	chars = ['\u2819', '\u2818', '\u2830', '\u2834', '\u2824', '\u2826', '\u2806', '\u2803', '\u280B', '\u2809'],
	delay = 100,
) {
	let loaderText = text;
	let previousText: string | null = null;
	let x = 0;

	const interval = setInterval(function () {
		if (previousText) {
			process.stdout.write('\r' + ' '.repeat(previousText.length + 5) + '\r');
			previousText = null;
		}

		process.stdout.write('\r' + chars[x++] + ' ' + loaderText);
		x = x % chars.length;
	}, delay);

	const stop = () => {
		clearInterval(interval);
		process.stdout.write('\r' + ' '.repeat(loaderText.length + 5) + '\r');
	};

	return {
		[Symbol.dispose]: stop,
		[Symbol.asyncDispose]: stop,
		updateText: (newText: string) => {
			previousText = loaderText;
			loaderText = newText;
		},
		stop,
	};
}
