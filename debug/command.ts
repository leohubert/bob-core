import { Command as BaseCommand, CommandWithSignature as BaseCommandWithSignature } from '@/src/index.js';

import { LoggerVerboseFlag } from './options/LoggerVerboseOption.js';

export type CommandContext = {
	bambooClient: {
		getProjects: () => Promise<any>;
	};
	logger: {
		verbose: boolean;
	};
};

export abstract class Command extends BaseCommandWithSignature<CommandContext> {
	static override baseFlags = {
		...BaseCommand.baseFlags,
		verbose: LoggerVerboseFlag,
	};
}
