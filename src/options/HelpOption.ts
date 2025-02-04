import chalk from "chalk";
import {max} from "lodash";

import {Command} from "@/src/Command.js";
import {generateSpace} from "@/src/lib/string.js";
import {ArgSignature} from "@/src/CommandParser.js";
import {CommandOption} from "@/src/contracts/index.js";

export class HelpOption implements CommandOption<Command> {

    option = 'help'
    alias = ['h']

    defaultValue = false

    description = chalk`Display help for the given command. When no command is given display help for the {green list} command`

    public async handler(this: Command): Promise<number|void> {
        const log = console.log

        const availableArguments = Object.values(this.parser.getArgumentSignatures())
        const availableOptions = Object.values(this.parser.getOptionSignatures())
            .map((signature) => ({
                ...signature,
                optionWithAlias: `--${signature.name}${signature.alias?.map(a => `, -${a}`).join('') ?? ''}`
            }) as ArgSignature & { optionWithAlias: string })

        const requiredArguments = availableArguments.filter((signature) => !signature.optional)

        log(chalk`{yellow Description}:`)
        log(chalk`  ${this.description}\n`)

        log(chalk`{yellow Usage}:`)
        log(chalk`  ${this.command} ${requiredArguments.length > 0 ? requiredArguments.map((signature) => `<${signature.name}>`).join(' ') : '\b'} [options]`)

        const maxOptionLength: number = max(availableOptions.map((signature) => signature.optionWithAlias.length)) ?? 0
        const maxArgumentLength: number = max(availableArguments.map((arg) => arg.name.length)) ?? 0
        const maxLength = maxArgumentLength > maxOptionLength ? maxArgumentLength : maxOptionLength

        if (availableArguments.length > 0) {
            log(chalk`\n{yellow Arguments}:`)

            for (const  signature of availableArguments) {
                const spaces = generateSpace(maxLength - signature.name.length)

                let message = chalk`  {green ${signature.name}} ${spaces} ${signature.help ?? '\b'}`

                if (signature.defaultValue !== undefined && signature.optional) {
                    const defaultValue = signature.type === 'array' ? JSON.stringify(signature.defaultValue) : signature.defaultValue

                    message += chalk` {yellow [default: ${defaultValue}]}`
                }

                if (signature.variadic) {
                    message += chalk` {white (variadic)}`
                }

                log(message)
            }
        }

        if (availableOptions.length > 0) {
            log(chalk`\n{yellow Options}:`)

            for (const signature of availableOptions) {
                const spaces = generateSpace(maxLength - signature.optionWithAlias.length)


                let message = chalk`{green ${signature.optionWithAlias}} ${spaces} ${signature.help ?? '\b'}`

                if (signature.type) {
                    message += chalk` {white (${signature.type})}`
                }

                if (signature.defaultValue !== undefined && signature.optional) {
                    const defaultValue = signature.type === 'array' ? JSON.stringify(signature.defaultValue) : signature.defaultValue
                    message += chalk` {yellow [default: ${defaultValue}]}`
                }

                log(message)
            }
        }

        if (this.commandsExamples.length > 0) {
            log(chalk`\n{yellow Examples}:`)
            let  binaryName = process.argv[0].split('/').pop()
            if (binaryName === 'node') {
                binaryName += ' ' + process.argv[1].split('/').pop()
            }

            for (const [index, example] of this.commandsExamples.entries()) {
                if (index > 0) {
                    log('')
                }
                log(`  ${example.description}\n`)
                log(chalk`    {green ${binaryName} ${example.command}}`)
            }
        }

        return -1;
    }
}