import {Command} from "./Command";
import chalk from "chalk";
import {max} from "lodash";
import {generateSpace} from "./lib/string";

export class CommandHelper {
    public help() {
        const command: Command = this as any

        const log = console.log

        const signatures = command.signatures()

        const availableArguments = Object.entries(signatures).filter(([_, signature]) => !signature.isOption)
        const availableOptions = Object.entries(signatures).filter(([_, signature]) => signature.isOption)

        const requiredArguments = availableArguments.filter(([_, signature]) => !signature.optional)

        log(chalk`{yellow Description}:`)
        log(chalk`  ${command.description}\n`)

        log(chalk`{yellow Usage}:`)
        log(chalk`  ${command.command} ${requiredArguments.length > 0 ? requiredArguments.map(([arg]) => `<${arg}>`).join(' ') : '\b'} [options]`)

        const maxOptionLength = max(availableOptions.map(([option]) => option.length)) ?? 0
        const maxArgumentLength = max(availableArguments.map(([arg]) => arg.length)) ?? 0
        const maxLength = maxArgumentLength > maxOptionLength ? maxArgumentLength : maxOptionLength

        if (availableArguments.length > 0) {
            log(chalk`{yellow Arguments}:`)

            for (const [argument, signature] of availableArguments) {
                const spaces = generateSpace(maxLength - argument.length)

                log(chalk`  {green ${argument}} ${spaces} ${signature.help ?? '\b'} ${signature.optional ? chalk`{gray (optional)}` : ''}`)
            }
            log(chalk``)
        }

        if (availableOptions.length > 0) {
            log(chalk`{yellow Options}:`)

            for (const [option, signature] of availableOptions) {
                const spaces = generateSpace(maxLength - option.length)

                log(chalk`  {green ${option}} ${spaces} ${signature.help ?? '\b'} `)
            }
        }


        return -1;
    }
}