import { Command as BaseCommand } from '@/src/index.js';

import { LoggerVerboseFlag } from './options/LoggerVerboseOption.js';

export type CommandContext = {
	bambooClient: {
		getProjects: () => Promise<any>;
	};
	logger: {
		verbose: boolean;
	};
};

export abstract class Command extends BaseCommand<CommandContext> {
	static baseFlags = {
		...BaseCommand.baseFlags,
		verbose: LoggerVerboseFlag,
	};
}
