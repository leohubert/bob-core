import minimist from 'minimist';

import { InvalidFlag } from '@/src/errors/InvalidFlag.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { MissingRequiredFlagValue } from '@/src/errors/MissingRequiredFlagValue.js';
import { BadCommandArgument, BadCommandFlag, TooManyArguments } from '@/src/errors/index.js';
import { Command } from '@/src/Command.js';
import { ArgumentsObject, ArgumentsSchema, ContextDefinition, FlagDefinition, FlagOpts, FlagReturnType, FlagsObject, FlagsSchema } from '@/src/lib/types.js';
import { UX } from '@/src/ux/index.js';

/**
 * Parses command-line arguments into typed flags and arguments
 * Handles validation, type conversion, and default values
 */
export class CommandParser<Flags extends FlagsSchema, Arguments extends ArgumentsSchema> {
	protected flags: FlagsSchema;
	protected parsedFlags: FlagsObject<Flags> | null = null;

	protected args: ArgumentsSchema;
	protected parsedArguments: FlagsObject<Arguments> | null = null;

	protected ux: UX;

	protected shouldPromptForMissingFlags = true;
	protected shouldValidateUnknownFlags = true;
	protected shouldRejectExtraArguments = false;

	constructor(protected opts: { flags: Flags; args: Arguments; ctx?: ContextDefinition; ux: UX; cmd?: typeof Command }) {
		this.ux = opts.ux;
		this.flags = opts.flags;
		this.args = opts.args;
	}

	// === PUBLIC METHODS ===

	/**
	 * Parses raw command-line arguments into structured flags and arguments
	 * @param args - Raw command line arguments (typically from process.argv.slice(2))
	 * @returns Object containing parsed flags and arguments
	 * @throws {InvalidFlag} If an unknown flag is provided
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
			const flagDefinition: FlagDefinition = this.flags[key];
			let flagValue = this.parsedFlags?.[key];
			const isEmpty = this.isEmptyValue(flagValue);

			if (flagDefinition.required && isEmpty) {
				if (!this.shouldPromptForMissingFlags) {
					throw new MissingRequiredFlagValue(key);
				}

				const newValue = await this.promptForArgument(key, flagDefinition);

				if (newValue != null && this.parsedFlags) {
					flagValue = await this.parseValue(newValue, flagDefinition, { name: key });
					(this.parsedFlags as any)[key] = flagValue;
				} else {
					throw new MissingRequiredFlagValue(key);
				}
			}
		}

		for (const key in this.args) {
			const argDefinition = this.args[key];
			let argValue = this.parsedArguments?.[key];
			const isEmpty = this.isEmptyValue(argValue);

			if (argDefinition.required && isEmpty) {
				if (!this.shouldPromptForMissingFlags) {
					throw new MissingRequiredArgumentValue(key);
				}

				const newValue = await this.promptForArgument(key, argDefinition);

				if (newValue != null && this.parsedArguments) {
					argValue = await this.parseValue(newValue, argDefinition, { name: key, isArg: true });
					(this.parsedArguments as any)[key] = argValue;
				} else {
					throw new MissingRequiredArgumentValue(key);
				}
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
			throw new Error('Flags have not been parsed yet. Call init() first.');
		}

		if (this.isEmptyValue(this.parsedFlags[name]) && defaultValue !== undefined) {
			return defaultValue;
		}

		return this.parsedFlags[name];
	}

	async setFlag<FlagName extends keyof Flags>(name: FlagName, value: FlagReturnType<Flags[FlagName]>): Promise<void> {
		if (!this.parsedFlags) {
			throw new Error('Flags have not been parsed yet. Call init() first.');
		}
		if (!(name in this.flags)) {
			throw new InvalidFlag(name as string, this.flags);
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

	async setArgument<ArgName extends keyof Arguments>(name: ArgName, value: FlagReturnType<Arguments[ArgName]>): Promise<void> {
		if (!this.parsedArguments) {
			throw new Error('Arguments have not been parsed yet. Call init() first.');
		}
		if (!(name in this.args)) {
			throw new BadCommandArgument({ arg: name as string, reason: `Argument "${name as string}" is not recognized` });
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
		return value === null || value === undefined || (typeof value == 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);
	}

	/**
	 * Validates that all provided flags are recognized
	 * @throws {InvalidFlag} If an unknown flag is found
	 */
	private validateUnknownFlags(rawFlags: Record<string, any>): void {
		const validOptionNames = new Set<string>();

		// Collect all valid flag names and their aliases
		for (const key in this.flags) {
			validOptionNames.add(key);
			const flagDetails = this.flags[key];
			const aliases = Array.isArray(flagDetails.alias) ? flagDetails.alias : flagDetails.alias ? [flagDetails.alias] : [];
			for (const alias of aliases) {
				validOptionNames.add(alias);
			}
		}

		// Check for unknown flags
		for (const flagName in rawFlags) {
			if (!validOptionNames.has(flagName)) {
				throw new InvalidFlag(flagName, this.flags);
			}
		}
	}

	/**
	 * Processes named flags from minimist output
	 */
	private async handleOptions(rawFlags: Record<string, unknown>): Promise<FlagsObject<Flags>> {
		const parsedOptions: FlagsObject<any> = {};

		for (const key in this.flags) {
			parsedOptions[key] = await this.resolveFlagValue(key, this.flags[key], rawFlags);
		}

		return parsedOptions;
	}

	/**
	 * Processes positional arguments from minimist output
	 */
	private async handleArguments(rawArgs: string[]): Promise<ArgumentsObject<Arguments>> {
		const parsedArgs: ArgumentsObject<any> = {};
		const remainingArgs = [...rawArgs];

		const expectedCount = Object.keys(this.args).length;

		for (const key in this.args) {
			const argDefinition = this.args[key];

			// Handle variadic arguments (consumes all remaining values)
			if ('multiple' in argDefinition && argDefinition.multiple) {
				parsedArgs[key] = await this.parseValue(remainingArgs, argDefinition, { name: key, isArg: true });
				remainingArgs.length = 0; // Clear remaining args since variadic consumes all
				continue;
			}

			parsedArgs[key] = await this.parseValue(remainingArgs.shift(), argDefinition, { name: key, isArg: true });
		}

		if (this.shouldRejectExtraArguments && remainingArgs.length > 0) {
			throw new TooManyArguments(expectedCount, expectedCount + remainingArgs.length);
		}

		return parsedArgs;
	}

	/**
	 * Resolves a flag value from the parsed flag values object
	 * Handles alias resolution, defaults, and type conversion
	 */
	private async resolveFlagValue(key: string, definition: FlagDefinition, rawFlags: Record<string, any>): Promise<any> {
		let rawValue: any = undefined;

		// Search through flag name and its aliases
		const allNames = [key];
		if (definition.alias) {
			allNames.push(...(Array.isArray(definition.alias) ? definition.alias : [definition.alias]));
		}

		for (const name of allNames) {
			if (name in rawFlags) {
				rawValue = rawFlags[name];
				break;
			}
		}

		return this.parseValue(rawValue, definition, { name: key });
	}

	/**
	 * Parses a raw value using the flag's parse function
	 */
	private async parseValue(value: any, definition: FlagDefinition, meta?: { name: string; isArg?: boolean }): Promise<any> {
		if (this.isEmptyValue(value)) {
			if (typeof definition.default === 'function') {
				return await definition.default();
			}

			return definition.default;
		}

		if ('multiple' in definition && definition.multiple) {
			if (!Array.isArray(value)) {
				value = [value];
			}

			const parsedArray: any = [];
			for (const item of value) {
				parsedArray.push(await this.safeParse(item, definition, meta));
			}
			return parsedArray;
		}

		return this.safeParse(value, definition, meta);
	}

	private buildFlagOpts(name: string, definition: FlagDefinition): FlagOpts {
		return { name, ux: this.ux, ctx: this.opts.ctx, definition, cmd: this.opts.cmd ?? Command };
	}

	private async safeParse(value: any, definition: FlagDefinition, meta?: { name: string; isArg?: boolean }): Promise<any> {
		try {
			return definition.parse(value, this.buildFlagOpts(meta?.name ?? '', definition));
		} catch (e) {
			if (e instanceof BadCommandFlag || e instanceof BadCommandArgument) throw e;
			if (!meta) throw e;
			const reason = e instanceof Error ? e.message : String(e);
			throw meta.isArg ? new BadCommandArgument({ arg: meta.name, value, reason }) : new BadCommandFlag({ flag: meta.name, value, reason });
		}
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
	 * Prompts the user to provide a missing flag/argument value via its `ask` method
	 * Used by validate() when shouldPromptForMissingFlags is enabled
	 * @param name - The name of the missing flag/argument
	 * @param definition - The flag's definition (must have an `ask` method)
	 * @returns The user-provided value, or null if `ask` is not defined
	 */
	protected async promptForArgument(name: string, definition: FlagDefinition): Promise<string | number | string[] | boolean | null> {
		if (!definition.ask) return null;
		return definition.ask(this.buildFlagOpts(name, definition));
	}
}
