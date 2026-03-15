import chalk from 'chalk';

import type { TableColumn, TableColumnAlignment } from '@/src/ux/types.js';

export function table<T extends Record<string, unknown>>(data: T[], columns?: TableColumn<T>[]): void {
	if (data.length === 0) return;

	const cols: TableColumn<T>[] = columns ?? (Object.keys(data[0]) as Array<keyof T & string>).map(key => ({ key }));

	const headers = cols.map(col => col.header ?? col.key.toUpperCase());

	const colWidths = cols.map((col, i) => {
		const contentMax = Math.max(
			headers[i].length,
			...data.map(row => {
				const val = col.format ? col.format(row[col.key]) : String(row[col.key] ?? '');
				return val.length;
			}),
		);
		return col.width ? Math.min(contentMax, col.width) : contentMax;
	});

	const sep = '  ';

	const formatCell = (text: string, width: number, alignment: TableColumnAlignment = 'left'): string => {
		if (text.length > width) {
			return text.slice(0, width - 1) + '\u2026';
		}
		switch (alignment) {
			case 'right':
				return text.padStart(width);
			case 'center': {
				const left = Math.floor((width - text.length) / 2);
				return ' '.repeat(left) + text + ' '.repeat(width - text.length - left);
			}
			default:
				return text.padEnd(width);
		}
	};

	// Header row
	const headerRow = cols.map((col, i) => formatCell(headers[i], colWidths[i], col.alignment)).join(sep);
	console.log(chalk.bold(headerRow));

	// Separator row
	const separatorRow = colWidths.map(w => '-'.repeat(w)).join(sep);
	console.log(chalk.dim(separatorRow));

	// Data rows
	for (const row of data) {
		const line = cols
			.map((col, i) => {
				const val = col.format ? col.format(row[col.key]) : String(row[col.key] ?? '');
				return formatCell(val, colWidths[i], col.alignment);
			})
			.join(sep);
		console.log(line);
	}
}
