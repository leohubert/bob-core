import {Command} from "../Command";
import {CommandRegistry} from "../CommandRegistry";
import chalk from "chalk";
import {max, orderBy} from "lodash";
import {generateSpace} from "../lib/string";

export type HelpCommandOptions = {
    commandRegistry: CommandRegistry
    cliName?: string
    cliVersion?: string
}

export default class HelpCommand extends Command {
    signature = 'help'
    description = 'Show help'

    constructor(private opts: HelpCommandOptions) {
        super();
    }

    protected async handle(): Promise<void> {
        const commands = this.opts.commandRegistry.getCommands()

        const cliName = this.opts.cliName ?? 'Bob CLI'
        const version = this.opts.cliVersion ?? '0.0.0'

        const coreVersion = require('../../package.json').version

        console.log(chalk`${cliName} {green ${version}} (core: {yellow ${coreVersion}})

{yellow Usage}:
  command [options] [arguments]

{yellow Available commands}:
`)

        const maxCommandLength = max(commands.map(command => command.command.length)) ?? 0
        const commandByGroups: { [key: string]: Command[] } = {}

        for (const command of commands) {
            const commandGroup = command.command.split(':')[0]

            if (!commandByGroups[commandGroup]) {
                commandByGroups[commandGroup] = []
            }

            commandByGroups[commandGroup].push(command)
        }

        const sortedCommandsByGroups = orderBy(
            orderBy(Object.entries(commandByGroups), [([group]) => group.toLowerCase()], ['asc']),
            [([_, commands]) => commands.length],
            ['asc'],
        )

        for (const [group, groupCommands] of sortedCommandsByGroups) {
            const isGrouped = groupCommands.length > 1

            if (isGrouped) {
                console.log(chalk`{yellow ${group}}:`)
            }

            const sortedGroupCommands = orderBy(groupCommands, [command => command.command.toLowerCase()], ['asc'])

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