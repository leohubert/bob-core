import chalk from 'chalk';

import { Logger } from '@/src/Logger.js';
import { BobError } from '@/src/errors/BobError.js';

export class MissingRequiredArgumentValue extends BobError {
	constructor(public readonly argument: string) {
		super(`Argument "${argument}" is required.`);
	}

	pretty(io: Logger): void {
		io.log(`${chalk.white.bgRed(' ERROR ')} Argument ${chalk.bold.yellow(this.argument)} is required.`);
	}
}
