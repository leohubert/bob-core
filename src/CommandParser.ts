import minimist from 'minimist'
import {MissingRequiredArgumentValue} from "./errors/MissingRequiredArgumentValue";

export type ArgSignature = {
    name: string
    type: string
    optional?: boolean
    variadic?: boolean
    alias?: string[]
    help?: string
    defaultValue?: string | boolean | Array<string> | null
    isOption?: boolean
}

export class CommandParser {

    public command: string
    private arguments: { [argument: string]: any } = {}
    private options: Record<string, any> = {}
    private argumentsSignature: { [argument: string]: ArgSignature } = {}
    private optionsSignature: { [option: string]: ArgSignature } = {}

    public option(name: string): any {
        if (!this.optionsSignature[name]) {
            throw new Error(`Option ${name} not found`)
        }

        const signature = this.optionsSignature[name]

        if (signature.type === 'boolean') {
            if (this.options[name] === 'true' || this.options[name] === '1') {
                return true
            } else if (this.options[name] === 'false' || this.options[name] === '0') {
                return false
            }
            return Boolean(this.options[name])
        }

        if (signature.type === 'array') {
            if (!this.options[name]) {
                return []
            }
            return Array.isArray(this.options[name]) ? this.options[name] : [this.options[name]]
        }

        return this.options[name]
    }

    public setOption(name: string, value: any) {
        this.options[name] = value
    }

    public argument(name: string): any {
        return this.arguments[name]
    }

    public setArgument(name: string, value: any) {
        this.arguments[name] = value
    }

    public argumentsSignatures() {
        return this.argumentsSignature
    }

    public optionsSignatures() {
        return this.optionsSignature
    }

    constructor(protected readonly signature: string, protected readonly helperDefinitions: { [key: string]: string }, ...args: any[]) {
        const [command, ...params] = signature.split(/\{(.*?)\}/g).map(param => param.trim()).filter(Boolean)

        const { _: paramValues, ...optionValues } = minimist(args)

        this.command = command
        this.parseSignature(params, optionValues, paramValues)
    }

    private parseSignature(params: string[], optionValues: any, paramValues: any[]) {
        for (const paramSignature of params) {
            const param = this.parseParamSignature(paramSignature)

            if (param.isOption) {
                const optionValue = optionValues[param.name]

                this.options[param.name] = optionValue ?? param.defaultValue ?? null
                this.optionsSignature[param.name] = param

                for (const alias of param.alias ?? []) {
                    if (optionValues[alias]) {
                        this.options[param.name] = optionValues[alias]
                        this.optionsSignature[param.name] = param
                    }
                }
            } else {

                if (param.variadic) {
                    const paramValue = paramValues.splice(0, paramValues.length)

                    this.arguments[param.name] = paramValue ?? []
                } else {
                    const paramValue = paramValues.shift()

                    this.arguments[param.name] = paramValue ?? param.defaultValue ?? null
                }


                this.argumentsSignature[param.name] = param
            }
        }
    }

    private parseParamSignature(argument: string): ArgSignature {
        let cleanedArgs = argument
        let isOptional = false
        let isVariadic = false

        if (cleanedArgs.endsWith('?')) {
            cleanedArgs = cleanedArgs.slice(0, -1)
            isOptional = true
        }

        if (cleanedArgs.endsWith('*'))  {
            cleanedArgs = cleanedArgs.slice(0, -1)
            isVariadic = true
        }

        const arg: ArgSignature = {
            name: cleanedArgs,
            optional: isOptional,
            type: isVariadic ? 'array' : 'string',
            help: undefined,
            defaultValue: isVariadic ? [] : null,
            variadic: isVariadic,
            isOption: false
        }

        if (arg.name.includes(':')) {
            const [name, help] = arg.name.split(':')
            arg.name = name.trim()
            arg.help = help.trim()
        }

        if (arg.name.includes('=')) {
            const [name, defaultValue] = arg.name.split('=')
            arg.name = name.trim()
            arg.defaultValue = defaultValue.trim()
            arg.optional = true

            if (!arg.defaultValue.length) {
                arg.defaultValue = null
            } else if (arg.defaultValue === 'true') {
                arg.defaultValue = true
                arg.type = 'boolean'
            } else if (arg.defaultValue === 'false') {
                arg.defaultValue = false
                arg.type = 'boolean'
            }
        } else {
            if (arg.name.startsWith('--')) {
                arg.optional = true
                arg.defaultValue = false
                arg.type = 'boolean'
            }
        }

        if (arg.name.includes('|')) {
            const [name, ...alias] = arg.name.split('|')
            arg.name = name.trim()
            arg.alias = alias.map(a => a.trim())
        }

        if (arg.name.startsWith('--')) {
            arg.isOption = true
            arg.name = arg.name.slice(2)
        }

        if (arg.defaultValue === '*') {
            arg.defaultValue = []
            arg.type = 'array'
        }

        arg.help = arg.help ?? this.helperDefinitions[arg.name] ?? this.helperDefinitions[`--${arg.name}`]

        return arg
    }

    public validate() {
        // validate arguments
        for (const [argument, value] of Object.entries(this.arguments)) {
            const argSignature = this.argumentsSignature[argument]

            if (!value && !argSignature.optional) {
                throw new MissingRequiredArgumentValue(argSignature)
            }

            if (!value?.length && argSignature.variadic && !argSignature.optional) {
                throw new MissingRequiredArgumentValue(argSignature)
            }
        }
    }

}