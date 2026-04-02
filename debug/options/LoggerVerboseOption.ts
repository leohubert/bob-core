import { Flags } from '@/src/flags/index.js';
import type { ParameterOpts } from '@/src/lib/types.js';

import { CommandContext } from '../command.js';

export const LoggerVerboseFlag = Flags.boolean({
	alias: ['v'],
	handler: (value: boolean, opts: ParameterOpts) => {
		if (value) {
			console.log('Verbose logging enabled');
			(opts.ctx as CommandContext).logger.verbose = true;
		}
	},
});
