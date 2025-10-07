import chalk from 'chalk';

import { BobError } from '@/src/errors/BobError.js';

export type ParameterProps = {
	param: string;
	value?: string;
	reason?: string;
};

export class BadCommandParameter extends BobError {
	constructor(public readonly param: ParameterProps) {
		let message = `Argument "${param.param}" value is invalid.`;
		if (param.reason) {
			message += ` Reason: ${param.reason}`;
		} else {
			message += ` Value: "${param.value}"`;
		}
		super(message);
	}

	pretty(io: any): void {
		io.log(`  ${chalk.white.bgRed(' ERROR ')} Argument ${chalk.bold.yellow(this.param.param)} value is invalid. `);

		if (this.param.value || this.param.reason) {
			io.log('');
		}

		if (this.param.value) {
			io.log(`  ${chalk.blue('Value')}: ${this.param.value}`);
		}
		if (this.param.reason) {
			io.log(`  ${chalk.yellow('Reason')}: ${this.param.reason}`);
		}
	}
}
