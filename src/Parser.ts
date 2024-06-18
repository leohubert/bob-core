import minimist from 'minimist'

export type ParamSignature = {
    name: string
    optional: boolean
    alias?: string
    help?: string
    defaultValue?: string | boolean | null
    isOption: boolean
}

export class Parser {

    public command: string
    private arguments: { [argument: string]: any } = {}
    private options: Record<string, any> = {}
    private argumentsSignature: { [argument: string]: ParamSignature } = {}

    public option(name: string): any {
        return this.options[name]
    }

    public argument(name: string): any {
        return this.arguments[name]
    }

    public signatures() {
        return this.argumentsSignature
    }

    constructor(signature: string, ...args: any[]) {
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
            } else {
                const paramValue = paramValues.shift()

                this.arguments[param.name] = paramValue ?? param.defaultValue ?? null
            }

            this.argumentsSignature[param.name] = param
        }
    }

    private parseParamSignature(argument: string): ParamSignature {
        let cleanedArgs = argument
        let isOptional = false
        if (argument.endsWith('?')) {
            cleanedArgs = cleanedArgs.slice(0, -1)
            isOptional = true
        }

        const arg: ParamSignature = {
            name: cleanedArgs,
            optional: isOptional,
            help: undefined,
            defaultValue: null,
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
            } else if (arg.defaultValue === 'false') {
                arg.defaultValue = false
            }
        } else {
            if (arg.name.startsWith('--')) {
                arg.defaultValue = false
            }
        }

        if (arg.name.startsWith('--')) {
            arg.isOption = true
            arg.name = arg.name.slice(2)
        }

        return arg
    }

    public validate() {
        // validate arguments
        for (const [argument, value] of Object.entries(this.arguments)) {
            const signature = this.argumentsSignature[argument]

            if (!value && !signature.optional) {
                const argumentHelp = signature.help ?? 'no help available'

                throw new Error(`Argument ${argument} is required. (help: ${argumentHelp})`)
            }
        }
    }

}