import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';

export type ErrorDetail = [label: string, value: string];

export type RenderErrorOptions = {
	title: string;
	details?: ErrorDetail[];
	hint?: string;
};

export function quote(name: string): string {
	return chalk.bold.yellow(`'${name}'`);
}

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;

function visibleWidth(s: string): number {
	return s.replace(ANSI_RE, '').length;
}

export function renderError(logger: Logger, opts: RenderErrorOptions): void {
	const { title, details, hint } = opts;
	const hasGutter = (details && details.length > 0) || hint != undefined;

	const bar = chalk.dim('│');
	const corner = chalk.dim('└─');

	logger.log('');
	logger.log(`  ${chalk.red('error:')} ${title}`);

	if (hasGutter) {
		logger.log(`   ${bar}`);

		if (details && details.length > 0) {
			const widths = details.map(([l]) => visibleWidth(l));
			const maxLabel = Math.max(...widths);
			for (let i = 0; i < details.length; i++) {
				const [label, value] = details[i];
				const pad = ' '.repeat(maxLabel - widths[i]);
				logger.log(`   ${bar}  ${label}${pad}  ${value}`);
			}
		}

		if (hint != undefined) {
			logger.log(`   ${bar}`);
			logger.log(`   ${corner} try: ${hint}`);
		} else {
			logger.log(`   ${bar}`);
		}
	}

	logger.log('');
}
