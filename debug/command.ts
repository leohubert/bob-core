import { CommandWithSignature as BaseCommand, CommandOption } from '@/src/index.js';

import { LoggerVerboseOption } from './options/LoggerVerboseOption.js';

export type CommandContext = {
	bambooClient: {
		getProjects: () => Promise<unknown>;
	};
	logger: {
		verbose: boolean;
	};
};

export abstract class Command extends BaseCommand<CommandContext> {
	protected defaultOptions(): CommandOption<Command>[] {
		return [...super.defaultOptions(), new LoggerVerboseOption()];
	}
}
