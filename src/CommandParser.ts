import minimist from "minimist";
import {
	OptionsSchema,
	OptionReturnType,
	OptionsObject,
	ArgumentsObject,
	OptionDefinition
} from "@/src/lib/types.js";
import {BadCommandOption} from "@/src/errors/index.js";
import {InvalidOption} from "@/src/errors/InvalidOption.js";
import {getOptionDetails, OptionDetails} from "@/src/lib/optionHelpers.js";
import {convertValue} from "@/src/lib/valueConverter.js";
import {CommandIO} from "@/src/CommandIO.js";
import {MissingRequiredArgumentValue} from "@/src/errors/MissingRequiredArgumentValue.js";
import {MissingRequiredOptionValue} from "@/src/errors/MissingRequiredOptionValue.js";
import chalk from "chalk";

/**
 * Parses command-line arguments into typed options and arguments
 * Handles validation, type conversion, and default values
 */
export class CommandParser<Options extends OptionsSchema, Arguments extends OptionsSchema> {

	protected options: Options;
	protected parsedOptions: OptionsObject<Options> | null = null;

	protected arguments: Arguments;
	protected parsedArguments: OptionsObject<Arguments> | null = null;

	protected io: CommandIO;

	protected shouldPromptForMissingOptions = true;

	constructor(opts: {
		io: CommandIO,
		options: Options,
		arguments: Arguments,
	}) {
		this.options = opts.options;
		this.arguments = opts.arguments;
		this.io = opts.io;
	}

	// === PUBLIC METHODS ===

	/**
	 * Parses raw command-line arguments into structured options and arguments
	 * @param args - Raw command line arguments (typically from process.argv.slice(2))
	 * @returns Object containing parsed options and arguments
	 * @throws {InvalidOption} If an unknown option is provided
	 * @throws {BadCommandOption} If a value cannot be converted to the expected type
	 */
	init(args: string[]): { options: OptionsObject<Options>, arguments: OptionsObject<Arguments> } {
		const {_: positionalArgs, ...optionValues} = minimist(args)

		this.validateUnknownOptions(optionValues);
		this.parsedOptions = this.handleOptions(optionValues);
		this.parsedArguments = this.handleArguments(positionalArgs);

		return {
			options: this.parsedOptions,
			arguments: this.parsedArguments,
		}
	}

	/**
	 * Validates the parsed options and arguments
	 * @throws {Error} If validation fails
	 */
	async validate(): Promise<void> {
		for (const key in this.options) {
			const optionDetails = getOptionDetails(this.options[key]);
			if (optionDetails.required && (this.parsedOptions?.[key] === undefined || this.parsedOptions?.[key] === null)) {
				throw new MissingRequiredOptionValue(key)
			}
		}

		for (const key in this.arguments) {
			const argDetails = getOptionDetails(this.arguments[key]);
			const value = this.parsedArguments?.[key];

			if (argDetails.required && (value === undefined || value === null)) {
				// Try prompting if enabled
				if (this.shouldPromptForMissingOptions) {
					const newValue = await this.promptForArgument(key, argDetails);

					if (newValue && this.parsedArguments) {
						(this.parsedArguments as any)[key] = convertValue(newValue, argDetails.type, key);
						continue;
					}
				}

				throw new MissingRequiredArgumentValue(key);
			}

			// Additional validation for variadic arguments
			if (argDetails.variadic && argDetails.required && Array.isArray(value) && value.length === 0) {
				throw new MissingRequiredArgumentValue(key);
			}
		}
	}

	/**
	 * Retrieves a parsed option value by name
	 * @param name - The option name
	 * @returns The typed option value
	 * @throws {Error} If init() has not been called yet
	 */
	option<OptsName extends keyof Options>(name: OptsName): OptionReturnType<Options[OptsName]> {
		if (!this.parsedOptions) {
			throw new Error('Options have not been parsed yet. Call init() first.');
		}
		return this.parsedOptions[name];
	}

	setOption<OptsName extends keyof Options>(name: OptsName, value: OptionReturnType<Options[OptsName]>): void {
		if (!this.parsedOptions) {
			throw new Error('Options have not been parsed yet. Call init() first.');
		}
		if (!(name in this.options)) {
			throw new InvalidOption(name as string, this.options);
		}
		(this.parsedOptions as any)[name] = value;
	}

	/**
	 * Retrieves a parsed argument value by name
	 * @param name - The argument name
	 * @returns The typed argument value
	 * @throws {Error} If init() has not been called yet
	 */
	argument<ArgName extends keyof Arguments>(name: ArgName): OptionReturnType<Arguments[ArgName]> {
		if (!this.parsedArguments) {
			throw new Error('Arguments have not been parsed yet. Call init() first.');
		}
		return this.parsedArguments[name];
	}

	setArgument<ArgName extends keyof Arguments>(name: ArgName, value: OptionReturnType<Arguments[ArgName]>): void {
		if (!this.parsedArguments) {
			throw new Error('Arguments have not been parsed yet. Call init() first.');
		}
		if (!(name in this.arguments)) {
			throw new InvalidOption(name as string, this.arguments);
		}
		(this.parsedArguments as any)[name] = value;
	}

	// === PRIVATE HELPERS ===

	/**
	 * Validates that all provided options are recognized
	 * @throws {InvalidOption} If an unknown option is found
	 */
	private validateUnknownOptions(optionValues: Record<string, any>): void {
		const validOptionNames = new Set<string>();

		// Collect all valid option names and their aliases
		for (const key in this.options) {
			validOptionNames.add(key);
			const optionDetails = getOptionDetails(this.options[key]);
			for (const alias of optionDetails.alias) {
				validOptionNames.add(alias);
			}
		}

		// Check for unknown options
		for (const optionName in optionValues) {
			if (!validOptionNames.has(optionName)) {
				throw new InvalidOption(optionName, this.options);
			}
		}
	}

	/**
	 * Processes named options from minimist output
	 */
	private handleOptions(optionValues: Record<string, any>): OptionsObject<Options> {
		const parsedOptions = {} as OptionsObject<Options>;

		for (const key in this.options) {
			const optionDetails = getOptionDetails(this.options[key]);
			parsedOptions[key] = this.resolveOptionValue(
				key,
				optionDetails,
				optionValues
			);
		}

		return parsedOptions;
	}

	/**
	 * Processes positional arguments from minimist output
	 */
	private handleArguments(positionalArgs: string[]): ArgumentsObject<Arguments> {
		const parsedArgs = {} as ArgumentsObject<Arguments>;
		const remainingArgs = [...positionalArgs];

		for (const key in this.arguments) {
			const argDefinition = getOptionDetails(this.arguments[key]);

			// Handle variadic arguments (consumes all remaining values)
			if (argDefinition.variadic) {
				parsedArgs[key] = this.handleVariadicArgument(key, argDefinition, remainingArgs);
				continue;
			}

			parsedArgs[key] = this.resolveArgumentValue(key, argDefinition, remainingArgs.shift());
		}

		return parsedArgs;
	}

	/**
	 * Handles variadic arguments that consume all remaining positional values
	 */
	private handleVariadicArgument(
		key: string,
		definition: OptionDetails,
		remainingArgs: string[]
	): any {
		// Variadic arguments are always arrays - convert each element if present, otherwise return default
		return remainingArgs.length
			? convertValue(remainingArgs, definition.type, key, definition.default)
			: definition.default;
	}

	/**
	 * Resolves a single positional argument value with defaults and type conversion
	 * Note: Does not validate required arguments - validation happens in subclass validate() methods
	 */
	private resolveArgumentValue(
		key: string,
		definition: OptionDetails,
		argValue: string | undefined
	): any {
		// If no value provided, return default (validation happens later)
		if (argValue === undefined) {
			return definition.default;
		}

		// Convert the value to the correct type
		return convertValue(argValue, definition.type, key, definition.default);
	}

	/**
	 * Resolves an option value from the parsed option values object
	 * Handles alias resolution, defaults, and type conversion
	 */
	private resolveOptionValue(
		key: string,
		definition: OptionDetails,
		optionValues: Record<string, any>,
	): any {
		let rawValue: any = undefined;

		// Search through option name and its aliases
		const allNames = [key, ...definition.alias];
		for (const name of allNames) {
			if (name in optionValues) {
				rawValue = optionValues[name];
				break;
			}
		}

		// Handle missing value
		if (rawValue === undefined) {
			if (definition.required) {
				throw new BadCommandOption({
					option: key,
					reason: `Required option is missing`,
				});
			}
			return definition.default;
		}

		// Convert to the correct type
		return convertValue(rawValue, definition.type, key, definition.default);
	}

	optionDefinitions(): Record<string, OptionDetails> {
		const defs: Record<string, OptionDetails> = {};
		for (const key in this.options) {
			defs[key] = getOptionDetails(this.options[key]);
		}
		return defs;
	}

	argumentDefinitions(): Record<string, OptionDetails> {
		const defs: Record<string, OptionDetails> = {};
		for (const key in this.arguments) {
			defs[key] = getOptionDetails(this.arguments[key]);
		}
		return defs;
	}

	availableOptions(): string[] {
		return Object.keys(this.options);
	}

	availableArguments(): string[] {
		return Object.keys(this.arguments);
	}

	/**
	 * Disables prompting for missing argument values
	 * Useful for non-interactive environments
	 */
	disablePrompting() {
		this.shouldPromptForMissingOptions = false;
		return this;
	}

	/**
	 * Prompts the user to provide a missing argument value via CommandIO
	 * Used by validate() when shouldPromptForMissingArgs is enabled
	 * @param argumentName - The name of the missing argument
	 * @param argDef - The argument's definition for type and description
	 * @returns The user-provided value, or null if none given
	 */
	protected async promptForArgument(
		argumentName: string,
		argDef: OptionDefinition
	): Promise<string | number | null> {
		if (Array.isArray(argDef.type) || !['string', 'number', 'secret'].includes(argDef.type)) {
			return null;
		}

		let promptText = chalk`{yellow.bold ${argumentName}} is required`;
		if (argDef.description) {
			promptText += chalk`: {gray (${argDef.description})}`;
		}
		promptText += '\n';

		return await this.io.askForInput(
			promptText,
			undefined,
			{
				type: argDef.type === 'number' ? 'number' : argDef.type === 'secret' ? 'password' : 'text',
				validate: (value: string | number) => {
					if (argDef.type === 'number') {
						const num = Number(value);
						if (isNaN(num)) {
							return 'Please enter a valid number';
						}
					} else if (argDef.type === 'string') {
						if (typeof value !== 'string' || !value.length) {
							return 'Please enter a valid text';
						}
					}
					return true;
				}
			}
		);
	}
}