import { Flags } from '../../src/index.js';
import { CommandContext } from '../command.js';

export const LoggerVerboseFlag = Flags.boolean({
	alias: ['v'],
	parse: (value: any, ctx: CommandContext, cmd) => {
		const enableVerbose = Flags.boolean().parse(value, ctx, cmd);
		if (enableVerbose) {
			ctx.logger.verbose = true;
		}
		return enableVerbose;
	},
});
