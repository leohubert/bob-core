import chalk from "chalk";

import {generateSpace} from "@/src/lib/string.js";
import {CommandOption} from "@/src/contracts/index.js";
import {Command} from "@/src/Command.js";
import {OptionPrimitive} from "@/src/lib/types.js";
import {OptionDetails} from "@/src/lib/optionHelpers.js";

export class HelpOption implements CommandOption<Command> {

    type: OptionPrimitive = 'boolean'
    option = 'help'
    alias = ['h']

    default = false

    description = chalk`Display help for the given command. When no command is given display help for the {green list} command`

    public async handler(this: Command): Promise<number|void> {
	    const argumentDefinitions = this.parser.argumentDefinitions();
	    const optionDefinitions = this.parser.optionDefinitions();

	    const availableArguments: [string, OptionDetails][] = Object.entries(argumentDefinitions)
	    const availableOptions: [string, OptionDetails][] = Object.entries(optionDefinitions)

        const optionsWithAlias = availableOptions.map(([name, signature]) => {
            const aliases = Array.isArray(signature.alias) ? signature.alias : signature.alias ? [signature.alias] : [];
            return {
                name,
                ...signature,
                optionWithAlias: `--${name}${aliases.map((a: string) => `, -${a}`).join('')}`
            };
        });

        const requiredArguments = availableArguments.filter(([, signature]) => signature.required);

        this.io.log(chalk`{yellow Description}:`)
        this.io.log(chalk`  ${this.description}\n`)

        this.io.log(chalk`{yellow Usage}:`)
        this.io.log(chalk`  ${this.command} ${requiredArguments.length > 0 ? requiredArguments.map(([name]) => `<${name}>`).join(' ') : '\b'} [options]`)

        const maxOptionLength: number = Math.max(...optionsWithAlias.map((opt) => opt.optionWithAlias.length), 0)
        const maxArgumentLength: number = Math.max(...availableArguments.map(([name]) => name.length), 0)
        const maxLength = maxArgumentLength > maxOptionLength ? maxArgumentLength : maxOptionLength

        if (availableArguments.length > 0) {
            this.io.log(chalk`\n{yellow Arguments}:`)

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

                this.io.log(message)
            }
        }

        if (availableOptions.length > 0) {
            this.io.log(chalk`\n{yellow Options}:`)

            for (const signature of optionsWithAlias) {
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

                this.io.log(message)
            }
        }

        // Only show examples for LegacyCommand which has commandsExamples property
        if (this.commandsExamples.length > 0) {
            this.io.log(chalk`\n{yellow Examples}:`)
            let  binaryName = process.argv[0].split('/').pop()
            if (binaryName === 'node') {
                binaryName += ' ' + process.argv[1].split('/').pop()
            }

            for (const [index, example] of (this as any).commandsExamples.entries()) {
                if (index > 0) {
                    this.io.log('')
                }
                this.io.log(`  ${example.description}\n`)
                this.io.log(chalk`    {green ${binaryName} ${example.command}}`)
            }
        }

        return -1;
    }
}