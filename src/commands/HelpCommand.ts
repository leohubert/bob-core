import chalk from "chalk";

import {CommandRegistry} from "@/src/CommandRegistry.js";
import {generateSpace} from "@/src/lib/string.js";
import {Command} from "@/src/Command.js";

export type HelpCommandOptions = {
    commandRegistry: CommandRegistry
    cliName?: string
    cliVersion?: string
}

export default class HelpCommand extends Command {
    constructor(private opts: HelpCommandOptions) {
        super('help', {
			description: chalk.bold('Show help information about the CLI and its commands')
        });
    }

	async handle(): Promise<void> {
        const commands = this.opts.commandRegistry.getCommands()

        const cliName = this.opts.cliName ?? 'Bob CLI'
        const version = this.opts.cliVersion ?? '0.0.0'

        const coreVersion = (await import('../../package.json'))?.default?.version ?? '0.0.0'

        this.io.log(chalk`${cliName} {green ${version}} (core: {yellow ${coreVersion}})

{yellow Usage}:
  command [options] [arguments]

{yellow Available commands}:
`)

        const maxCommandLength = Math.max(...commands.map(command => command.command.length)) ?? 0
        const commandByGroups: { [key: string]: Array<Command> } = {}

        for (const command of commands) {
            const commandGroup = command.command.split(':')[0]

            if (!commandByGroups[commandGroup]) {
                commandByGroups[commandGroup] = []
            }

            commandByGroups[commandGroup].push(command)
        }

        const sortedCommandsByGroups = Object.entries(commandByGroups)
            .sort(([groupA], [groupB]) => groupA.toLowerCase().localeCompare(groupB.toLowerCase()))
            .sort(([, commandsA], [, commandsB]) => commandsA.length - commandsB.length)

        for (const [group, groupCommands] of sortedCommandsByGroups) {
            const isGrouped = groupCommands.length > 1

            if (isGrouped) {
                this.io.log(chalk`{yellow ${group}}:`)
            }

            const sortedGroupCommands = groupCommands.sort((a, b) => a.command.toLowerCase().localeCompare(b.command.toLowerCase()))

            for (const command of sortedGroupCommands) {
                let spaces = generateSpace(maxCommandLength - command.command.length)
                if (isGrouped) {
                    spaces = spaces.slice(2)
                }
                this.io.log(chalk`${isGrouped ? '  ' : ''}{green ${command.command}} ${spaces} ${command.description}`)
            }
        }
    }

}