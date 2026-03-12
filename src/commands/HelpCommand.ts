import chalk from 'chalk';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { generateSpace } from '@/src/lib/string.js';

export type HelpCommandOptions = {
	commandRegistry: CommandRegistry;
	cliName?: string;
	cliVersion?: string;
};

export default class HelpCommand extends Command {
	static command = 'help';
	static description = chalk.bold('Show help information about the CLI and its commands');

	constructor(private opts: HelpCommandOptions) {
		super();
	}

	async handle(): Promise<void> {
		const commands = this.opts.commandRegistry.getCommands().filter(Cmd => !Cmd.hidden);

		const cliName = this.opts.cliName ?? 'Bob CLI';
		const version = this.opts.cliVersion ?? '0.0.0';

		const coreVersion = (await import('../../package.json'))?.default?.version ?? '0.0.0';

		this.io.log(`${cliName} ${chalk.green(version)} (core: ${chalk.yellow(coreVersion)})

${chalk.yellow('Usage')}:
  command [options] [arguments]

${chalk.yellow('Available commands')}:
`);

		const maxCommandLength = Math.max(...commands.map(Cmd => Cmd.command.length)) ?? 0;
		const commandByGroups: { [key: string]: Array<typeof Command> } = {};

		for (const Cmd of commands) {
			const commandGroup = Cmd.group ?? Cmd.command.split(':')[0];

			if (!commandByGroups[commandGroup]) {
				commandByGroups[commandGroup] = [];
			}

			commandByGroups[commandGroup].push(Cmd);
		}

		const sortedCommandsByGroups = Object.entries(commandByGroups)
			.sort(([groupA], [groupB]) => groupA.toLowerCase().localeCompare(groupB.toLowerCase()))
			.sort(([, commandsA], [, commandsB]) => commandsA.length - commandsB.length);

		for (const [group, groupCommands] of sortedCommandsByGroups) {
			const isGrouped = groupCommands.length > 1;

			if (isGrouped) {
				this.io.log(chalk.yellow(`${group}:`));
			}

			const sortedGroupCommands = groupCommands.sort((a, b) => a.command.toLowerCase().localeCompare(b.command.toLowerCase()));

			for (const Cmd of sortedGroupCommands) {
				let spaces = generateSpace(maxCommandLength - Cmd.command.length);
				if (isGrouped) {
					spaces = spaces.slice(2);
				}
				this.io.log(`${isGrouped ? '  ' : ''}${chalk.green(Cmd.command)} ${spaces} ${Cmd.description}`);
			}
		}
	}
}
