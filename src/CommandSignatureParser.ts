import {MissingRequiredArgumentValue} from "@/src/errors/MissingRequiredArgumentValue.js";
import {MissingSignatureOption} from "@/src/errors/MissingSignatureOption.js";
import {MissingSignatureArgument} from "@/src/errors/MissingSignatureArgument.js";
import {CommandOption} from "@/src/contracts/index.js";
import {CommandIO} from "@/src/CommandIO.js";
import {Option, OptionDefinition, OptionReturnType, OptionsObject, OptionsSchema} from "@/src/lib/types.js";
import {CommandParser} from "@/src/CommandParser.js";
import chalk from "chalk";
import {getOptionDetails} from "@/src/lib/optionHelpers.js";

/**
 * Extends CommandParser to parse command signatures like "command {arg} {--option}"
 * Handles interactive prompting for missing required arguments via CommandIO
 */
export class CommandSignatureParser<Opts extends OptionsSchema = any, Args extends OptionsSchema = any> extends CommandParser<Opts, Args> {

	public readonly command: string;
	private readonly argumentsSchema: Args
	private readonly optionsSchema: Opts

	constructor(opts: {
		io: CommandIO,
		signature: string,
		helperDefinitions: { [key: string]: string },
		defaultOptions: CommandOption<any>[],
	}) {
		// Parse signature to extract command name and parameter schemas
		const parseResult = CommandSignatureParser.parseSignature<Opts, Args>(
			opts.signature,
			opts.helperDefinitions,
			opts.defaultOptions
		);

		// Initialize parent with schemas
		super({io: opts.io, options: parseResult.options, arguments: parseResult.arguments });

		// Store parsed definitions for later access
		this.command = parseResult.command;
		this.optionsSchema = parseResult.options;
		this.argumentsSchema = parseResult.arguments;
	}

	/**
	 * Parses command signature string into command name and parameter schemas
	 * Example: "migrate {name} {--force}" -> { command: "migrate", arguments: {name: ...}, options: {force: ...} }
	 */
	private static parseSignature<Opts extends OptionsSchema, Args extends OptionsSchema>(
		signature: string,
		helperDefinitions: { [key: string]: string },
		defaultCommandOptions: CommandOption<any>[]
	): { command: string, options: Opts, arguments: Args } {

		const [command, ...signatureParams] = signature.split(/\{(.*?)\}/g)
			.map(param => param.trim())
			.filter(Boolean);

		const optionsSchema: OptionsSchema = {};
		const argumentsSchema: OptionsSchema = {};

		// Parse each {param} from signature
		for (const paramSignature of signatureParams) {
			const {name, isOption, definition} = CommandSignatureParser.parseParamSignature(
				paramSignature,
				helperDefinitions
			);

			if (isOption) {
				optionsSchema[name] = definition;
			} else {
				argumentsSchema[name] = definition;
			}
		}

		// Add default command options (e.g., global --help, --version)
		for (const option of defaultCommandOptions) {
			optionsSchema[option.option] = {
				type: option.type,
				required: option.required,
				alias: option.alias,
				variadic: option.variadic ?? false,
				description: option.description,
				default: option.default ?? null
			};
		}

		return { command, options: optionsSchema as Opts, arguments: argumentsSchema as Args };
	}

	// === PUBLIC API ===

	/**
	 * Retrieves an option value by name, with signature validation
	 */
	public option(name: any): any {
		if (!this.optionsSchema[name]) {
			throw new MissingSignatureOption(name as string, this.optionsSchema)
		}
		return super.option(name);
	}

	/**
	 * Sets an option value programmatically
	 */
	public setOption(name: string, value: any): void {
		if (!this.optionsSchema[name]) {
			throw new MissingSignatureOption(name, this.optionsSchema)
		}
		if (this.parsedOptions) {
			(this.parsedOptions as any)[name] = value;
		}
	}

	/**
	 * Retrieves the description/help text for an option
	 */
	public optionHelp(name: string): string | undefined {
		if (!this.optionsSchema[name]) {
			throw new MissingSignatureOption(name, this.optionsSchema)
		}
		return getOptionDetails(this.optionsSchema[name]).description
	}

	/**
	 * Retrieves the description/help text for an argument
	 */
	public argumentHelp(name: string): string | undefined {
		if (!this.argumentsSchema[name]) {
			throw new MissingSignatureArgument(name, this.argumentsSchema)
		}
		return getOptionDetails(this.argumentsSchema[name]).description
	}

	/**
	 * Retrieves an argument value by name, with signature validation
	 */
	public argument(name: any):any {
		if (!this.argumentsSchema[name]) {
			throw new MissingSignatureArgument(name as string, this.argumentsSchema)
		}
		return super.argument(name)
	}

	/**
	 * Sets an argument value programmatically
	 */
	public setArgument(name: string, value: any): void {
		if (!this.argumentsSchema[name]) {
			throw new MissingSignatureArgument(name, this.argumentsSchema)
		}
		if (this.parsedArguments) {
			(this.parsedArguments as any)[name] = value;
		}
	}

	/**
	 * Returns all argument definitions from the signature
	 */
	public getArgumentSignatures(): OptionsSchema {
		return this.argumentsSchema
	}

	/**
	 * Returns all option definitions from the signature
	 */
	public getOptionSignatures(): OptionsSchema {
		return this.optionsSchema
	}


	/**
	 * Parses a single parameter signature like "{name}" or "{--force}" or "{files*}"
	 * Extracts name, type, default value, aliases, description, etc.
	 *
	 * Signature syntax:
	 * - {arg}          -> required string argument
	 * - {arg?}         -> optional argument
	 * - {arg=default}  -> argument with default value
	 * - {arg*}         -> variadic argument (array)
	 * - {arg:desc}     -> argument with description
	 * - {--opt}        -> boolean option
	 * - {--opt=}       -> string option
	 * - {--opt|o}      -> option with alias
	 */
	private static parseParamSignature(
		paramSignature: string,
		helperDefinitions: { [key: string]: string }
	): { name: string, isOption: boolean, definition: OptionDefinition } {
		let name = paramSignature;
		let isOption = false;
		const definition: OptionDefinition = {
			required: true,
			type: 'string',
			description: undefined,
			default: null,
			variadic: false
		}

		// Extract description {arg:description}
		if (name.includes(':')) {
			const [paramName, description] = name.split(':')
			name = paramName.trim()
			definition.description = description.trim()
		}

		// Extract default value {arg=default}
		if (name.includes('=')) {
			const [paramName, defaultValue] = name.split('=')
			name = paramName.trim()
			definition.default = defaultValue.trim()
			definition.required = false

			// Handle special default values
			if (!definition.default.length) {
				definition.default = null
			} else if (definition.default === 'true') {
				definition.default = true
				definition.type = 'boolean'
			} else if (definition.default === 'false') {
				definition.default = false
				definition.type = 'boolean'
			}
		} else if (name.startsWith('--')) {
			// Boolean option without explicit default
			definition.required = false
			definition.default = false
			definition.type = 'boolean'
		}

		// Extract aliases {arg|a|alias}
		if (name.includes('|')) {
			const [paramName, ...aliases] = name.split('|')
			name = paramName.trim()
			definition.alias = aliases.map(a => a.trim())
		}

		// Detect if it's an option {--option}
		if (name.startsWith('--')) {
			isOption = true
			name = name.slice(2)
		}

		// Handle variadic/array default {arg=*}
		if (definition.default === '*') {
			definition.default = []
			definition.type = ['string']
		}

		// Optional marker {arg?}
		if (name.endsWith('?')) {
			definition.required = false
			name = name.slice(0, -1)
		}

		// Variadic marker {arg*}
		if (name.endsWith('*')) {
			definition.type = ['string']
			definition.variadic = true
			definition.default = []
			name = name.slice(0, -1)
		}

		// Fallback to helper definitions for description
		definition.description = definition.description
			?? helperDefinitions[name]
			?? helperDefinitions[`--${name}`]

		return { name, isOption, definition }
	}

	/**
	 * Validates that all required arguments are present
	 * If missing, prompts the user via CommandIO to provide them
	 * @throws {MissingRequiredArgumentValue} If a required argument cannot be obtained
	 */
	public async validate(): Promise<void> {
		for (const argumentName in this.argumentsSchema) {
			const optionDetails = getOptionDetails(this.argumentsSchema[argumentName])
			const value = this.argument(argumentName)

			// Check if required argument is missing
			if (!value && optionDetails.required) {
				const newValue = await this.promptForArgument(argumentName, optionDetails)

				if (newValue) {
					this.setArgument(argumentName, newValue)
				} else {
					throw new MissingRequiredArgumentValue(argumentName)
				}
			}

			// Check if required variadic argument is empty
			if (optionDetails.variadic && optionDetails.required && typeof value === 'object' && !value?.length ) {
				throw new MissingRequiredArgumentValue(argumentName)
			}
		}
	}

	/**
	 * Prompts the user to provide a missing argument value via CommandIO
	 */
	private async promptForArgument(
		argumentName: string,
		argDef: OptionDefinition
	): Promise<string | null> {
		// Only handle string arguments for now
		if (argDef.type !== 'string') {
			return null
		}

		let promptText = chalk`{yellow.bold ${argumentName}} is required`
		if (argDef.description) {
			promptText += chalk`: {gray (${argDef.description})}`
		}
		promptText += '\n'

		return await this.io.askForInput(
			promptText,
			argDef.default as string | undefined,
			{
				validate: (value) => {
					if (!value?.trim()?.length) {
						return `${argumentName} cannot be empty`
					}
					return true
				}
			}
		)
	}

	public optionValues(): OptionsObject<Opts> {
		if (!this.parsedOptions) {
			throw new Error("Options have not been parsed yet. Call init() first.");
		}

		return this.parsedOptions
	}

	public argumentValues(): OptionsObject<Args> {
		if (!this.parsedArguments) {
			throw new Error("Arguments have not been parsed yet. Call init() first.");
		}
		return this.parsedArguments
	}
}