import { Flags } from '@/src/flags/index.js';

import { CommandContext } from '../command.js';

export const LoggerVerboseFlag = Flags.boolean({
	alias: ['v'],
	handler: (value: boolean, ctx: CommandContext) => {
		if (value) {
			console.log('Verbose logging enabled');
			ctx.logger.verbose = true;
		}
	},
});
