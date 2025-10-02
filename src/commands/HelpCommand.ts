import chalk from "chalk";

import {LegacyCommand} from "@/src/LegacyCommand.js";
import {CommandRegistry} from "@/src/CommandRegistry.js";
import {generateSpace} from "@/src/lib/string.js";

export type HelpCommandOptions = {
    commandRegistry: CommandRegistry
    cliName?: string
    cliVersion?: string
}

export default class HelpCommand extends LegacyCommand {
    signature = 'help'
    description = 'Show help'

    constructor(private opts: HelpCommandOptions) {
        super();
    }

    protected async handle(): Promise<void> {
        const commands = this.opts.commandRegistry.getCommands()

        const cliName = this.opts.cliName ?? 'Bob CLI'
        const version = this.opts.cliVersion ?? '0.0.0'

        const coreVersion = (await import('../../package.json'))?.default?.version ?? '0.0.0'

        console.log(chalk`${cliName} {green ${version}} (core: {yellow ${coreVersion}})

{yellow Usage}:
  command [options] [arguments]

{yellow Available commands}:
`)

        const maxCommandLength = Math.max(...commands.map(command => command.command.length)) ?? 0
        const commandByGroups: { [key: string]: LegacyCommand[] } = {}

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
                console.log(chalk`{yellow ${group}}:`)
            }

            const sortedGroupCommands = groupCommands.sort((a, b) => a.command.toLowerCase().localeCompare(b.command.toLowerCase()))

            for (const command of sortedGroupCommands) {
                let spaces = generateSpace(maxCommandLength - command.command.length)
                if (isGrouped) {
                    spaces = spaces.slice(2)
                }
                console.log(chalk`${isGrouped ? '  ' : ''}{green ${command.command}} ${spaces} ${command.description}`)
            }
        }
    }

}