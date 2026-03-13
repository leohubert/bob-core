import { Flags } from '../../src/index.js';
import { CommandContext } from '../command.js';

export const LoggerVerboseFlag = Flags.boolean({
	alias: ['v'],
	handler: (value: boolean, ctx: CommandContext) => {
		if (value) {
			ctx.logger.verbose = true;
		}
	},
});
