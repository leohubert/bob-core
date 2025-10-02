import chalk from "chalk";

import {LegacyCommand} from "@/src/LegacyCommand.js";
import {generateSpace} from "@/src/lib/string.js";
import {OptionDefinition} from "@/src/lib/types.js";
import {CommandOption} from "@/src/contracts/index.js";

export class HelpOption implements CommandOption<LegacyCommand> {

    option = 'help'
    alias = ['h']

    defaultValue = false

    description = chalk`Display help for the given command. When no command is given display help for the {green list} command`

    public async handler(this: LegacyCommand): Promise<number|void> {
        const log = console.log

        const availableArguments = Object.entries(this.parser.getArgumentSignatures())
        const availableOptions = Object.entries(this.parser.getOptionSignatures())
            .map(([name, signature]) => ({
				name,
                ...signature,
                optionWithAlias: `--${name}${signature.alias?.map(a => `, -${a}`).join('') ?? ''}`
            }))

        const requiredArguments = availableArguments.filter(([name, signature]) => signature.required)

        log(chalk`{yellow Description}:`)
        log(chalk`  ${this.description}\n`)

        log(chalk`{yellow Usage}:`)
        log(chalk`  ${this.command} ${requiredArguments.length > 0 ? requiredArguments.map(([name]) => `<${name}>`).join(' ') : '\b'} [options]`)

        const maxOptionLength: number = Math.max(...availableOptions.map((opt) => opt.optionWithAlias.length)) ?? 0
        const maxArgumentLength: number = Math.max(...availableArguments.map(([name]) => name.length)) ?? 0
        const maxLength = maxArgumentLength > maxOptionLength ? maxArgumentLength : maxOptionLength

        if (availableArguments.length > 0) {
            log(chalk`\n{yellow Arguments}:`)

            for (const [name, signature] of availableArguments) {
                const spaces = generateSpace(maxLength - name.length)

                let message = chalk`  {green ${name}} ${spaces} ${signature.description ?? '\b'}`

                if (signature.default !== undefined && !signature.required) {
					const typeDisplay = Array.isArray(signature.type) ? `[${signature.type[0]}]` : signature.type;
                    const defaultValue = typeDisplay === 'array' || Array.isArray(signature.type) ? JSON.stringify(signature.default) : signature.default

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


                let message = chalk`{green ${signature.optionWithAlias}} ${spaces} ${signature.description ?? '\b'}`

                if (signature.type) {
					const typeDisplay = Array.isArray(signature.type) ? `[${signature.type[0]}]` : signature.type;
                    message += chalk` {white (${typeDisplay})}`
                }

                if (signature.default !== undefined && !signature.required) {
					const typeDisplay = Array.isArray(signature.type) ? `[${signature.type[0]}]` : signature.type;
                    const defaultValue = typeDisplay === 'array' || Array.isArray(signature.type) ? JSON.stringify(signature.default) : signature.default
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