import minimist from 'minimist'

import {MissingRequiredArgumentValue} from "@/src/errors/MissingRequiredArgumentValue.js";
import {MissingSignatureOption} from "@/src/errors/MissingSignatureOption.js";
import {MissingSignatureArgument} from "@/src/errors/MissingSignatureArgument.js";
import {InvalidOption} from "@/src/errors/InvalidOption.js";
import {CommandOption} from "@/src/contracts/index.js";
import {CommandIO} from "@/src/CommandIO.js";
import chalk from "chalk";

export type ArgSignature = {
	name: string
	type: 'string' | 'boolean' | 'array'
	optional?: boolean
	variadic?: boolean
	alias?: string[]
	help?: string
	defaultValue: string | boolean | Array<string> | null
	isOption?: boolean
}

export class CommandParser {

	public command: string
	private arguments: { [argument: string]: any } = {}
	private options: Record<string, any> = {}
	private argumentsSignature: { [argument: string]: ArgSignature } = {}
	private optionSignatures: { [option: string]: ArgSignature } = {}
	private optionAliases: { [alias: string]: string } = {}

	constructor(
		protected readonly io: CommandIO,
		protected readonly signature: string,
		protected readonly helperDefinitions: { [key: string]: string },
		protected readonly defaultCommandOptions: CommandOption<any>[],
		...args: any[]) {
		const [command, ...signatureParams] = signature.split(/\{(.*?)\}/g).map(param => param.trim()).filter(Boolean)

		const {_: paramValues, ...optionValues} = minimist(args)
		this.command = command
		this.parseSignature(signatureParams)
		this.parseDefaultOptions()
		this.handleArguments(paramValues)
		this.handleOptions(optionValues)
	}

	public option(name: string): any {
		if (!this.optionSignatures[name]) {
			throw new MissingSignatureOption(name, Object.values(this.optionSignatures))
		}
		return this.options[name]
	}

	public setOption(name: string, value: any) {
		if (!this.optionSignatures[name]) {
			throw new MissingSignatureOption(name, Object.values(this.optionSignatures))
		}
		this.options[name] = value
	}

	public optionHelp(name: string): string | undefined {
		const optionSignature = this.optionSignatures[name]
		if (!optionSignature) {
			throw new MissingSignatureOption(name, Object.values(this.optionSignatures))
		}
		return this.optionSignatures[name].help
	}

	public argument(name: string): any {
		if (!this.argumentsSignature[name]) {
			throw new MissingSignatureArgument(name, Object.values(this.argumentsSignature))
		}
		return this.arguments[name]
	}

	public setArgument(name: string, value: any) {
		if (!this.argumentsSignature[name]) {
			throw new MissingSignatureArgument(name, Object.values(this.argumentsSignature))
		}
		this.arguments[name] = value
	}

	public argumentHelp(name: string): string | undefined {
		const argumentSignature = this.argumentsSignature[name]
		if (!argumentSignature) {
			throw new MissingSignatureArgument(name, Object.values(this.argumentsSignature))
		}
		return this.argumentsSignature[name].help
	}

	public getArgumentSignatures() {
		return this.argumentsSignature
	}

	public getOptionSignatures() {
		return this.optionSignatures
	}

	private getParamValue(value: any, signature: ArgSignature) {
		if (signature.type === 'boolean') {
			if (value === 'true' || value === '1') {
				return true
			} else if (value === 'false' || value === '0') {
				return false
			}
			return Boolean(value)
		}

		if (signature.type === 'array') {
			if (!value) {
				return []
			}
			return Array.isArray(value) ? value : [value]
		}

		return value ?? signature.defaultValue
	}

	private handleArguments(paramValues: string[]) {
		for (const [argument, value] of Object.entries(this.arguments)) {
			const argSignature = this.argumentsSignature[argument]

			if (argSignature.variadic) {
				this.arguments[argument] = paramValues
			} else {
				const paramValue = paramValues.shift()

				this.arguments[argument] = this.getParamValue(paramValue, argSignature)
			}
		}
	}

	private handleOptions(optionValues: Record<string, any>) {
		for (const [option, value] of Object.entries(optionValues)) {
			const optionAlias = this.optionAliases[option]
			const optionSignature = this.optionSignatures[option] ?? this.optionSignatures[optionAlias]

			if (!optionSignature) {
				throw new InvalidOption(option, Object.values(this.optionSignatures))
			}

			this.options[option] = this.getParamValue(value, optionSignature)

			for (const alias of optionSignature.alias ?? []) {
				if (optionValues[alias]) {
					this.options[optionSignature.name] = optionValues[alias]
				}
			}
		}
	}

	private parseSignature(params: string[]) {
		for (const paramSignature of params) {
			const param = this.parseParamSignature(paramSignature)

			if (param.isOption) {
				this.options[param.name] = param.defaultValue ?? null
				this.optionSignatures[param.name] = param

				for (const alias of param.alias ?? []) {
					this.optionAliases[alias] = param.name
				}
			} else {
				this.arguments[param.name] = param.defaultValue ?? null
				this.argumentsSignature[param.name] = param
			}
		}
	}

	private parseDefaultOptions() {
		if (this.defaultCommandOptions.length) {
			for (const option of this.defaultCommandOptions) {
				this.optionSignatures[option.option] = {
					name: option.option,
					type: option.defaultValue == null ? 'string' : typeof option.defaultValue === 'boolean' ? 'boolean' : Array.isArray(option.defaultValue) ? 'array' : 'string',
					optional: true,
					alias: option.alias,
					variadic: false,
					help: option.description,
					defaultValue: option.defaultValue ?? null,
					isOption: true
				}
				this.options[option.option] = option.defaultValue
				if (option.alias) {
					for (const alias of option.alias) {
						this.optionAliases[alias] = option.option
					}
				}
			}
		}
	}

	private parseParamSignature(argument: string): ArgSignature {
		const arg: ArgSignature = {
			name: argument,
			optional: false,
			type: 'string',
			help: undefined,
			defaultValue: null,
			variadic: false,
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

		if (arg.name.endsWith('?')) {
			arg.optional = true
			arg.name = arg.name.slice(0, -1)
		}

		if (arg.name.endsWith('*')) {
			arg.type = 'array'
			arg.variadic = true
			arg.defaultValue = []
			arg.name = arg.name.slice(0, -1)
		}

		arg.help = arg.help ?? this.helperDefinitions[arg.name] ?? this.helperDefinitions[`--${arg.name}`]

		return arg
	}

	public async validate() {
		// validate arguments
		for (const [argument, value] of Object.entries(this.arguments)) {
			const argSignature = this.argumentsSignature[argument]

			if (!value && !argSignature.optional) {
				let newValue: any = null

				switch (argSignature.type) {
					case 'string':

						let text = chalk`{yellow.bold ${argSignature.name}} is required`
						if (argSignature.help) {
							text += chalk`: {gray (${argSignature.help})}`
						}
						text += '\n'


						newValue = await this.io.askForInput(text, argSignature.defaultValue as string | undefined, {
							validate: (value) => {
								if (!Boolean(value?.trim()?.length)) {
									return `${argSignature.name} cannot be empty`
								}
								return true
							}
						})
						break;
				}

				if (newValue) {
					this.setArgument(argument, newValue)
				} else {
					throw new MissingRequiredArgumentValue(argSignature)
				}

			}

			if (!value?.length && argSignature.variadic && !argSignature.optional) {
				throw new MissingRequiredArgumentValue(argSignature)
			}
		}
	}
}