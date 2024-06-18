import {Command} from "./Command";
import chalk from "chalk";
import {max} from "lodash";
import {generateSpace} from "./lib/string";
import {ArgSignature} from "./Parser";

export class CommandHelper {

    get defaultOptions(): ArgSignature[] {
        return [
            {
                name: 'help',
                optional: true,
                help: chalk`Display help for the given command. When no command is given display help for the {green list} command`,
                alias: ['h']
            }
        ]
    }

    public help(this: Command<any>): number {
        const log = console.log

        const availableArguments = Object.values(this.parser.argumentsSignatures())
        const availableOptions = [...Object.values(this.parser.optionsSignatures()), ...this.defaultOptions]
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

                log(chalk`  {green ${signature.name}} ${spaces} ${signature.help ?? '\b'} ${signature.defaultValue !== undefined && signature.optional ? chalk`{yellow [default: ${signature.defaultValue}]}` : ''}`)
            }
        }

        if (availableOptions.length > 0) {
            log(chalk`\n{yellow Options}:`)

            for (const signature of availableOptions) {
                const spaces = generateSpace(maxLength - signature.optionWithAlias.length)



                log(chalk`  {green ${signature.optionWithAlias}} ${spaces} ${signature.help ?? '\b'}  ${signature.defaultValue !== undefined && signature.optional ? chalk`{yellow [default: ${signature.defaultValue}]}` : ''}`)
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