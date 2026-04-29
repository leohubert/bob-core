import type { ProgressBarOptions } from '@/src/ux/types.js';

export function newProgressBar(total: number, opts?: ProgressBarOptions) {
	const width = opts?.width ?? 30;
	const completeChar = opts?.completeChar ?? '\u2588';
	const incompleteChar = opts?.incompleteChar ?? '\u2591';

	let current = 0;
	let stopped = false;

	const render = () => {
		if (stopped) return;

		const ratio = total <= 0 ? 1 : Math.min(current / total, 1);
		const filled = Math.round(ratio * width);
		const bar = completeChar.repeat(filled) + incompleteChar.repeat(width - filled);
		const percent = Math.round(ratio * 100);
		const line = `${bar}  ${percent}%  ${current}/${total}`;
		process.stdout.write('\r' + line);

		if (total <= 0 || current >= total) stop();
	};

	const stop = () => {
		if (stopped) return;
		stopped = true;
		process.stdout.write('\n');
	};

	render();

	return {
		increment: (amount = 1) => {
			if (stopped) return;
			current = Math.min(current + amount, total);
			render();
		},
		update: (value: number) => {
			if (stopped) return;
			current = Math.max(0, Math.min(value, total));
			render();
		},
		stop,
		[Symbol.dispose]: stop,
		[Symbol.asyncDispose]: stop,
	};
}
