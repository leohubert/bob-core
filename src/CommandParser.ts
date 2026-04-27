import minimist from 'minimist';

import { Command } from '@/src/Command.js';
import { InvalidFlag } from '@/src/errors/InvalidFlag.js';
import { MissingRequiredArgumentValue } from '@/src/errors/MissingRequiredArgumentValue.js';
import { MissingRequiredFlagValue } from '@/src/errors/MissingRequiredFlagValue.js';
import { ValidationError } from '@/src/errors/ValidationError.js';
import { BadCommandArgument, BadCommandFlag, TooManyArguments } from '@/src/errors/index.js';
import { ArgsSchema, ContextDefinition, FlagDefinition, FlagOpts, FlagReturnType, FlagsObject, FlagsSchema } from '@/src/lib/types.js';
import { UX } from '@/src/ux/index.js';

type ParameterKind = 'flag' | 'arg';

/**
 * Parses command-line arguments into typed flags and arguments.
 *
 * Lifecycle:
 *   1. `init(argv)` — runs minimist, validates unknown flags, type-converts each
 *      value via its definition's `parse` function, and resolves defaults.
 *   2. `validate()` — checks for missing required values; if prompting is
 *      enabled and the definition declares an `ask` function, the user is
 *      prompted and the response is fed back through `parse`.
 *   3. `flag(name)` / `argument(name)` — typed accessors for the parsed values.
 */
export class CommandParser<Flags extends FlagsSchema, Arguments extends ArgsSchema> {
	protected flags: FlagsSchema;
	protected parsedFlags: FlagsObject<Flags> | null = null;

	protected args: ArgsSchema;
	protected parsedArgs: FlagsObject<Arguments> | null = null;

	protected ux: UX;

	protected shouldPromptForMissingFlags = true;
	protected shouldValidateUnknownFlags = true;
	protected shouldRejectExtraArguments = false;

	constructor(protected opts: { flags: Flags; args: Arguments; ctx?: ContextDefinition; ux: UX; cmd?: typeof Command }) {
		this.ux = opts.ux;
		this.flags = opts.flags;
		this.args = opts.args;
	}

	/**
	 * Parses raw command-line arguments into structured flags and arguments.
	 *
	 * @param args - Raw command line arguments (typically from `process.argv.slice(2)`).
	 * @returns Object containing parsed flags and arguments.
	 * @throws {InvalidFlag} If an unknown flag is provided and `allowUnknownFlags` is off.
	 * @throws {BadCommandFlag} If a flag's value cannot be converted by its `parse` function.
	 * @throws {BadCommandArgument} If an argument's value cannot be converted by its `parse` function.
	 * @throws {TooManyArguments} If more positional arguments were supplied than declared and strict mode is on.
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
		this.parsedArgs = await this.handleArguments(rawArgs);

		return {
			flags: this.parsedFlags,
			args: this.parsedArgs,
		};
	}

	/**
	 * Validates that all required flags and arguments have a value. Prompts for
	 * missing values when prompting is enabled and the definition declares an
	 * `ask` function; otherwise throws.
	 *
	 * @throws {MissingRequiredFlagValue} If a required flag is missing.
	 * @throws {MissingRequiredArgumentValue} If a required argument is missing.
	 * @throws {BadCommandFlag} / {BadCommandArgument} If a prompted value fails to parse.
	 */
	async validate(): Promise<void> {
		await this.validateSchema(this.flags, this.parsedFlags, 'flag');
		await this.validateSchema(this.args, this.parsedArgs, 'arg');
	}

	/**
	 * Retrieves a parsed flag value by name. The runtime `defaultValue` is only
	 * used when the parsed value is empty (null/undefined/empty string/empty
	 * array) — it does not override a real value the user supplied.
	 *
	 * @throws {Error} If `init()` has not been called yet.
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
	 * Retrieves a parsed argument value by name. Same `defaultValue` semantics
	 * as {@link flag}.
	 *
	 * @throws {Error} If `init()` has not been called yet.
	 */
	argument<ArgName extends keyof Arguments>(name: ArgName, defaultValue?: FlagReturnType<Arguments[ArgName]>): FlagReturnType<Arguments[ArgName]> {
		if (!this.parsedArgs) {
			throw new Error('Arguments have not been parsed yet. Call init() first.');
		}

		if (this.isEmptyValue(this.parsedArgs[name]) && defaultValue !== undefined) {
			return defaultValue;
		}

		return this.parsedArgs[name];
	}

	async setArgument<ArgName extends keyof Arguments>(name: ArgName, value: FlagReturnType<Arguments[ArgName]>): Promise<void> {
		if (!this.parsedArgs) {
			throw new Error('Arguments have not been parsed yet. Call init() first.');
		}
		if (!(name in this.args)) {
			throw new BadCommandArgument({ arg: name as string, reason: `Argument "${name as string}" is not recognized` });
		}

		(this.parsedArgs as any)[name] = value;
	}

	/**
	 * "Empty" for runtime accessor / required-prompt purposes: null, undefined,
	 * an all-whitespace string, or an empty array. Whitespace strings are
	 * intentionally included so a user typing `--name=" "` is still treated as
	 * not having satisfied a required flag (and so accessor defaults still kick
	 * in for blank values).
	 *
	 * Use {@link isMissing} when you only care whether the user *omitted* a
	 * value — that's the right check for "should I substitute the schema's
	 * default?"
	 */
	private isEmptyValue(value: any): boolean {
		return value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);
	}

	/**
	 * "Missing" for default-substitution purposes: the user did not supply
	 * anything. An empty/whitespace string is *not* missing — the user typed it
	 * and the schema's `parse` should be allowed to accept or reject it.
	 */
	private isMissing(value: any): boolean {
		return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
	}

	private validateUnknownFlags(rawFlags: Record<string, any>): void {
		const validOptionNames = new Set<string>();
		for (const key in this.flags) {
			validOptionNames.add(key);
			const flagDetails = this.flags[key];
			const aliases = Array.isArray(flagDetails.alias) ? flagDetails.alias : flagDetails.alias ? [flagDetails.alias] : [];
			for (const alias of aliases) {
				validOptionNames.add(alias);
			}
		}

		for (const flagName in rawFlags) {
			if (!validOptionNames.has(flagName)) {
				throw new InvalidFlag(flagName, this.flags);
			}
		}
	}

	private async handleOptions(rawFlags: Record<string, unknown>): Promise<FlagsObject<Flags>> {
		const parsedOptions: FlagsObject<any> = {};

		for (const key in this.flags) {
			parsedOptions[key] = await this.resolveFlagValue(key, this.flags[key], rawFlags);
		}

		return parsedOptions;
	}

	private async handleArguments(rawArgs: string[]): Promise<FlagsObject<Arguments>> {
		const parsedArgs: FlagsObject<any> = {};
		const remainingArgs = [...rawArgs];

		const expectedCount = Object.keys(this.args).length;

		for (const key in this.args) {
			const argDefinition: FlagDefinition = this.args[key];

			if (argDefinition.multiple) {
				parsedArgs[key] = await this.parseValue(remainingArgs, argDefinition, 'arg', { name: key });
				// A `multiple` (variadic) argument consumes everything left, so the
				// strict-mode "extra args" check below sees an empty list.
				remainingArgs.length = 0;
				continue;
			}

			parsedArgs[key] = await this.parseValue(remainingArgs.shift(), argDefinition, 'arg', { name: key });
		}

		if (this.shouldRejectExtraArguments && remainingArgs.length > 0) {
			throw new TooManyArguments(expectedCount, expectedCount + remainingArgs.length);
		}

		return parsedArgs;
	}

	private async resolveFlagValue(key: string, definition: FlagDefinition, rawFlags: Record<string, any>): Promise<any> {
		let rawValue: any = undefined;

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

		return this.parseValue(rawValue, definition, 'flag', { name: key });
	}

	private async parseValue(value: any, definition: FlagDefinition, kind: ParameterKind, meta?: { name: string }): Promise<any> {
		if (this.isMissing(value)) {
			if (typeof definition.default === 'function') {
				return await (definition.default as () => unknown)();
			}

			return definition.default;
		}

		if (definition.multiple) {
			if (!Array.isArray(value)) {
				value = [value];
			}

			const parsedArray: any = [];
			for (const item of value) {
				parsedArray.push(await this.safeParse(item, definition, kind, meta));
			}
			return parsedArray;
		}

		return this.safeParse(value, definition, kind, meta);
	}

	private buildOpts(name: string, definition: FlagDefinition): FlagOpts {
		return { name, ux: this.ux, ctx: this.opts.ctx, definition, cmd: this.opts.cmd ?? Command };
	}

	/**
	 * Wraps a definition's `parse` and converts user-input failures into
	 * {@link BadCommandFlag}/{@link BadCommandArgument}. Programmer bugs (any
	 * error that isn't a {@link ValidationError}) propagate unchanged so they
	 * surface as real stack traces instead of being misreported as "flag value
	 * is invalid".
	 */
	private async safeParse(value: any, definition: FlagDefinition, kind: ParameterKind, meta?: { name: string }): Promise<any> {
		try {
			return definition.parse(value, this.buildOpts(meta?.name ?? '', definition));
		} catch (e) {
			if (e instanceof BadCommandFlag || e instanceof BadCommandArgument) throw e;
			if (!(e instanceof ValidationError)) throw e;
			if (!meta) throw e;
			const reason = e.message;
			if (kind === 'flag') {
				throw new BadCommandFlag({ flag: meta.name, value, reason });
			}
			throw new BadCommandArgument({ arg: meta.name, value, reason });
		}
	}

	private async validateSchema(schema: FlagsSchema | ArgsSchema, parsed: FlagsObject<any> | null, kind: ParameterKind): Promise<void> {
		for (const key in schema) {
			const definition = schema[key];
			let value = parsed?.[key];
			const isEmpty = this.isEmptyValue(value);

			if (definition.required && isEmpty) {
				if (!this.shouldPromptForMissingFlags) {
					throw kind === 'flag' ? new MissingRequiredFlagValue(key) : new MissingRequiredArgumentValue(key);
				}

				const newValue = await this.promptFor(key, definition);

				if (newValue != null && parsed) {
					value = await this.parseValue(newValue, definition, kind, { name: key });
					(parsed as any)[key] = value;
				} else {
					throw kind === 'flag' ? new MissingRequiredFlagValue(key) : new MissingRequiredArgumentValue(key);
				}
			}
		}
	}

	/** Disables prompting for missing flag and argument values — useful for non-interactive environments. */
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
	 * Prompts the user for a missing value via the definition's `ask` function.
	 * Returns `null` if no `ask` is registered or the user cancels — callers
	 * are responsible for translating that into a `MissingRequired*` error.
	 */
	protected async promptFor(name: string, definition: FlagDefinition): Promise<string | number | string[] | boolean | null> {
		if (!definition.ask) return null;
		return definition.ask(this.buildOpts(name, definition));
	}
}
