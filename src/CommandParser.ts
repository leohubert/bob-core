import chalk from 'chalk';
import fs from 'fs';
import minimist from 'minimist';

import { CommandIO } from '@/src/CommandIO.js';
import { InvalidOption } from '@/src/errors/InvalidOption.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { MissingRequiredOptionValue } from '@/src/errors/MissingRequiredOptionValue.js';
import { BadCommandFlag, TooManyArguments } from '@/src/errors/index.js';
import { ArgumentsObject, ArgumentsSchema, ContextDefinition, FlagDefinition, FlagReturnType, FlagsObject, FlagsSchema } from '@/src/lib/types.js';

/**
 * Parses command-line arguments into typed flags and arguments
 * Handles validation, type conversion, and default values
 */
export class CommandParser<Flags extends FlagsSchema, Arguments extends ArgumentsSchema> {
	protected flags: FlagsSchema;
	protected parsedFlags: FlagsObject<Flags> | null = null;

	protected args: ArgumentsSchema;
	protected parsedArguments: FlagsObject<Arguments> | null = null;

	protected io: CommandIO;

	protected shouldPromptForMissingFlags = true;
	protected shouldValidateUnknownFlags = true;
	protected shouldRejectExtraArguments = false;

	constructor(protected opts: { flags: Flags; args: Arguments; ctx: ContextDefinition; io: CommandIO }) {
		this.io = opts.io;
		this.flags = opts.flags;
		this.args = opts.args;
	}

	// === PUBLIC METHODS ===

	/**
	 * Parses raw command-line arguments into structured flags and arguments
	 * @param args - Raw command line arguments (typically from process.argv.slice(2))
	 * @returns Object containing parsed flags and arguments
	 * @throws {InvalidOption} If an unknown flag is provided
	 * @throws {BadCommandFlag} If a value cannot be converted to the expected type
	 */
	async init(args: string[]): Promise<{
		flags: FlagsObject<Flags>;
		args: FlagsObject<Arguments>;
	}> {
		const { _: rawArgs, ...rawFlags } = minimist(args);

		if (this.shouldValidateUnknownFlags) {
			this.validateUnknownFlags(rawFlags);
		}
		this.parsedFlags = await this.handleOptions(rawFlags);
		this.parsedArguments = await this.handleArguments(rawArgs);

		return {
			flags: this.parsedFlags,
			args: this.parsedArguments,
		};
	}

	/**
	 * Validates the parsed flags and arguments
	 * @throws {Error} If validation fails
	 */
	async validate(): Promise<void> {
		for (const key in this.flags) {
			const flagDetails = this.flags[key];
			if (flagDetails.required && (this.parsedFlags?.[key] === undefined || this.parsedFlags?.[key] === null)) {
				throw new MissingRequiredOptionValue(key);
			}

			// Validate file/directory existence
			const value = this.parsedFlags?.[key];
			if (value !== null && value !== undefined) {
				await this.validateFlagValue(key, flagDetails, value);
			}
		}

		for (const key in this.args) {
			const argDefinition = this.args[key];
			const value = this.parsedArguments?.[key];

			if (argDefinition.required && (value === undefined || value === null)) {
				// Try prompting if enabled
				if (this.shouldPromptForMissingFlags) {
					const newValue = await this.promptForArgument(key, argDefinition);

					if (newValue && this.parsedArguments) {
						(this.parsedArguments as any)[key] = await this.parseValue(newValue, argDefinition, key);
						continue;
					}
				}

				throw new MissingRequiredArgumentValue(key);
			}

			// Additional validation for variadic arguments
			if (argDefinition.required && 'multiple' in argDefinition && argDefinition.multiple && Array.isArray(value) && value.length === 0) {
				if (this.shouldPromptForMissingFlags) {
					const newValue = await this.promptForArgument(key, argDefinition);

					if (newValue && this.parsedArguments) {
						(this.parsedArguments as any)[key] = await this.parseValue(newValue, argDefinition, key);
						continue;
					}
				}

				throw new MissingRequiredArgumentValue(key);
			}

			// Validate file/directory/custom for args too
			if (value !== null && value !== undefined) {
				await this.validateFlagValue(key, argDefinition, value);
			}
		}
	}

	/**
	 * Retrieves a parsed flag value by name
	 * @param name - The flag name
	 * @param defaultValue - Optional default value if flag is not set
	 * @returns The typed flag value
	 * @throws {Error} If init() has not been called yet
	 */
	flag<FlagName extends keyof Flags>(name: FlagName, defaultValue?: FlagReturnType<Flags[FlagName]>): FlagReturnType<Flags[FlagName]> {
		if (!this.parsedFlags) {
			throw new Error('Options have not been parsed yet. Call init() first.');
		}

		if (this.isEmptyValue(this.parsedFlags[name]) && defaultValue !== undefined) {
			return defaultValue;
		}

		return this.parsedFlags[name];
	}

	setFlag<FlagName extends keyof Flags>(name: FlagName, value: FlagReturnType<Flags[FlagName]>): void {
		if (!this.parsedFlags) {
			throw new Error('Flag have not been parsed yet. Call init() first.');
		}
		if (!(name in this.flags)) {
			throw new InvalidOption(name as string, this.flags);
		}

		(this.parsedFlags as any)[name] = value;
	}

	/**
	 * Retrieves a parsed argument value by name
	 * @param name - The argument name
	 * @param defaultValue - Optional default value if argument is not set
	 * @returns The typed argument value
	 * @throws {Error} If init() has not been called yet
	 */
	argument<ArgName extends keyof Arguments>(name: ArgName, defaultValue?: FlagReturnType<Arguments[ArgName]>): FlagReturnType<Arguments[ArgName]> {
		if (!this.parsedArguments) {
			throw new Error('Arguments have not been parsed yet. Call init() first.');
		}

		if (this.isEmptyValue(this.parsedArguments[name]) && defaultValue !== undefined) {
			return defaultValue;
		}

		return this.parsedArguments[name];
	}

	setArgument<ArgName extends keyof Arguments>(name: ArgName, value: FlagReturnType<Arguments[ArgName]>): void {
		if (!this.parsedArguments) {
			throw new Error('Arguments have not been parsed yet. Call init() first.');
		}
		if (!(name in this.args)) {
			throw new InvalidOption(name as string, this.args);
		}

		(this.parsedArguments as any)[name] = value;
	}

	// === PRIVATE HELPERS ===

	/**
	 * Checks if a value should be considered "empty" for default value purposes
	 * @param value - The value to check
	 * @returns true if the value is null, undefined, or an empty array
	 */
	private isEmptyValue(value: any): boolean {
		return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
	}

	/**
	 * Validates that all provided flags are recognized
	 * @throws {InvalidOption} If an unknown flag is found
	 */
	private validateUnknownFlags(flagValues: Record<string, any>): void {
		const validOptionNames = new Set<string>();

		// Collect all valid flag names and their aliases
		for (const key in this.flags) {
			validOptionNames.add(key);
			const flagDetails = this.flags[key];
			for (const alias of flagDetails.alias ?? []) {
				validOptionNames.add(alias);
			}
		}

		// Check for unknown flags
		for (const flagName in flagValues) {
			if (!validOptionNames.has(flagName)) {
				throw new InvalidOption(flagName, this.flags);
			}
		}
	}

	/**
	 * Processes named flags from minimist output
	 */
	private async handleOptions(flagValues: Record<string, unknown>): Promise<FlagsObject<Flags>> {
		const parsedOptions: FlagsObject<any> = {};

		for (const key in this.flags) {
			parsedOptions[key] = (await this.resolveOptionValue(key, this.flags[key], flagValues)) as FlagReturnType<Flags[typeof key]>;
		}

		return parsedOptions;
	}

	/**
	 * Processes positional arguments from minimist output
	 */
	private async handleArguments(positionalArgs: string[]): Promise<ArgumentsObject<Arguments>> {
		const parsedArgs: ArgumentsObject<any> = {};
		const remainingArgs = [...positionalArgs];

		const expectedCount = Object.keys(this.args).length;

		for (const key in this.args) {
			const argDefinition = this.args[key];

			// Handle variadic arguments (consumes all remaining values)
			if ('multiple' in argDefinition && argDefinition.multiple) {
				parsedArgs[key] = (await this.handleVariadicArgument(key, argDefinition, remainingArgs)) as FlagReturnType<Arguments[typeof key]>;
				remainingArgs.length = 0;
				continue;
			}

			parsedArgs[key] = (await this.resolveArgumentValue(key, argDefinition, remainingArgs.shift())) as FlagReturnType<Arguments[typeof key]>;
		}

		if (this.shouldRejectExtraArguments && remainingArgs.length > 0) {
			throw new TooManyArguments(expectedCount, expectedCount + remainingArgs.length);
		}

		return parsedArgs;
	}

	/**
	 * Handles variadic arguments that consume all remaining positional values
	 */
	private async handleVariadicArgument(key: string, definition: FlagDefinition, remainingArgs: string[]): Promise<any> {
		return remainingArgs.length ? await this.parseValue(remainingArgs, definition, key) : definition.default;
	}

	/**
	 * Resolves a single positional argument value with defaults and type conversion
	 */
	private async resolveArgumentValue(key: string, definition: FlagDefinition, argValue: string | undefined): Promise<any> {
		if (argValue === undefined) {
			return definition.default;
		}

		return await this.parseValue(argValue, definition, key);
	}

	/**
	 * Resolves a flag value from the parsed flag values object
	 * Handles alias resolution, defaults, and type conversion
	 */
	private async resolveOptionValue(key: string, definition: FlagDefinition, flagValues: Record<string, unknown>): Promise<any> {
		let rawValue: any = undefined;

		// Search through flag name and its aliases
		const allNames = [key];
		if (definition.alias) {
			allNames.push(...(Array.isArray(definition.alias) ? definition.alias : [definition.alias]));
		}

		for (const name of allNames) {
			if (name in flagValues) {
				rawValue = flagValues[name];
				break;
			}
		}

		// Handle missing value
		if (rawValue === undefined) {
			if (definition.required) {
				throw new BadCommandFlag({
					flag: key,
					reason: `Required flag is missing`,
				});
			}
			return definition.default;
		}

		return await this.parseValue(rawValue, definition, key);
	}

	/**
	 * Parses a raw value using the flag's parse function
	 */
	private async parseValue(value: any, definition: FlagDefinition, name: string): Promise<any> {
		if (value === null || value === undefined) {
			return definition.default;
		}

		// Array types: handle multiple values
		if (Array.isArray(definition.type) || ('multiple' in definition && definition.multiple)) {
			const arr = Array.isArray(value) ? value : [value];
			// For array primitive types (e.g. ['string'], ['number']), the parse function
			// from flags.ts already handles array mapping, so pass the whole array
			if (Array.isArray(definition.type)) {
				return await this.callParse(arr, definition, name);
			}
			// For multiple (enum/custom), parse each element individually
			return Promise.all(arr.map(v => this.callParse(v, definition, name)));
		}

		return await this.callParse(value, definition, name);
	}

	private async callParse(value: any, details: FlagDefinition, name: string): Promise<any> {
		try {
			return await details.parse(value, this.opts.ctx);
		} catch (err) {
			throw new BadCommandFlag({
				flag: name,
				reason: err instanceof Error ? err.message : `Failed to parse "${value}"`,
			});
		}
	}

	/**
	 * Validates type-specific constraints (file/directory existence, custom validate)
	 */
	private async validateFlagValue(key: string, details: FlagDefinition, value: any): Promise<void> {
		if (details.type === 'file' && details.exists) {
			try {
				const stat = fs.statSync(value);
				if (!stat.isFile()) {
					throw new BadCommandFlag({ flag: key, reason: `"${value}" is not a file` });
				}
			} catch (err) {
				if (err instanceof BadCommandFlag) throw err;
				throw new BadCommandFlag({ flag: key, reason: `File "${value}" does not exist` });
			}
		}

		if (details.type === 'directory' && details.exists) {
			try {
				const stat = fs.statSync(value);
				if (!stat.isDirectory()) {
					throw new BadCommandFlag({ flag: key, reason: `"${value}" is not a directory` });
				}
			} catch (err) {
				if (err instanceof BadCommandFlag) throw err;
				throw new BadCommandFlag({ flag: key, reason: `Directory "${value}" does not exist` });
			}
		}

		if (details.type === 'custom' && details.validate) {
			const result = await details.validate(value);
			if (result !== true) {
				throw new BadCommandFlag({ flag: key, reason: result });
			}
		}
	}

	flagDefinitions(): Record<string, FlagDefinition> {
		const defs: Record<string, FlagDefinition> = {};
		for (const key in this.flags) {
			defs[key] = this.flags[key];
		}
		return defs;
	}

	argumentDefinitions(): Record<string, FlagDefinition> {
		const defs: Record<string, FlagDefinition> = {};
		for (const key in this.args) {
			defs[key] = this.args[key];
		}
		return defs;
	}

	availableFlags(): string[] {
		return Object.keys(this.flags);
	}

	availableArguments(): string[] {
		return Object.keys(this.args);
	}

	/**
	 * Disables prompting for missing argument values
	 * Useful for non-interactive environments
	 */
	disablePrompting() {
		this.shouldPromptForMissingFlags = false;
		return this;
	}

	allowUnknownFlags() {
		this.shouldValidateUnknownFlags = false;
		return this;
	}

	strictMode() {
		this.shouldRejectExtraArguments = true;
		return this;
	}

	/**
	 * Prompts the user to provide a missing argument value via CommandIO
	 * Used by validate() when shouldPromptForMissingArgs is enabled
	 * @param argumentName - The name of the missing argument
	 * @param argDef - The argument's definition for type and description
	 * @returns The user-provided value, or null if none given
	 */
	protected async promptForArgument(argumentName: string, argDef: FlagDefinition): Promise<string | number | string[] | null> {
		const type = argDef.type;

		// For enum type, show a select prompt
		if (type === 'enum' && argDef.options) {
			let promptText = `${chalk.yellow.bold(argumentName)} is required`;
			if (argDef.description) {
				promptText += `: ${chalk.gray(`(${argDef.description})`)}`;
			}
			promptText += ` ${chalk.green('(enum)')}\n`;

			const choices = argDef.options.map(o => ({ title: o, value: o }));
			return await this.io.askForSelect(promptText, choices);
		}

		// For new non-promptable types, skip
		if (!Array.isArray(type) && !['string', 'number'].includes(type as string)) {
			return null;
		}

		let promptText = `${chalk.yellow.bold(argumentName)} is required`;
		if (argDef.description) {
			promptText += `: ${chalk.gray(`(${argDef.description})`)}`;
		}
		const typeDisplay = Array.isArray(type) ? `${type[0]}[]` : type;
		promptText += ` ${chalk.green(`(${typeDisplay}${'multiple' in argDef && argDef.multiple == true ? '[]' : ''})`)}\n`;

		if (Array.isArray(type)) {
			promptText += 'Please provide one or more values, separated by commas:\n';

			return await this.io.askForList(promptText, undefined, {
				separator: ',',
				validate: (value: string) => {
					if (!value.length) {
						return 'Please enter at least one value';
					}

					if (type[0] === 'number') {
						for (const val of value.split(',')) {
							if (isNaN(Number(val))) {
								return `Please enter only valid numbers`;
							}
						}
					}

					return true;
				},
			});
		}

		return await this.io.askForInput(promptText, undefined, {
			type: type === 'number' ? 'number' : argDef.secret ? 'password' : 'text',
			validate: (value: string | number) => {
				if (value === null || value === undefined || (typeof value === 'string' && !value.length)) {
					return 'This value is required';
				}

				if (type === 'number') {
					const num = Number(value);
					if (isNaN(num)) {
						return 'Please enter a valid number';
					}
				} else if (type === 'string') {
					if (typeof value !== 'string' || !value.length) {
						return 'Please enter a valid text';
					}
				}
				return true;
			},
		});
	}
}
