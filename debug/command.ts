import { Command as BaseCommand, CommandWithSignature as BaseCommandWithSignature, FlagsSchema } from '@/src/index.js';

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
	static override baseFlags: FlagsSchema = {
		...BaseCommand.baseFlags,
		verbose: LoggerVerboseFlag,
	};
}
