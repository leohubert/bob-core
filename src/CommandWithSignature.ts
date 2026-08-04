import { Command, CommandRunOption } from '@/src/Command.js';
import { CommandSignatureParser } from '@/src/CommandSignatureParser.js';
import { ContextDefinition } from '@/src/lib/types.js';

/**
 * @deprecated Use `Command` with explicit `flags` and `args` instead. This class will be removed in a future major release.
 *
 * CommandWithSignature allows defining a command using a concise signature string, which is parsed to generate flags and arguments.
 * The signature is parsed lazily on first run to avoid unnecessary overhead if the command is never executed.
 */
export abstract class CommandWithSignature<C extends ContextDefinition = ContextDefinition> extends Command<C> {
	static signature: string = '';
	static helperDefinitions: Record<string, string> = {};

	// Derive command name from signature for CommandRegistry
	static get command(): string {
		return this.signature.split(/\s/)[0] || '';
	}

	/**
	 * Materializes `flags`/`args` from the signature string, once per subclass.
	 *
	 * Called on first run, and by anything that needs to read the schema without running the
	 * command — shell completion in particular, which would otherwise see an empty schema and
	 * suggest no flags at all for signature-based commands.
	 */
	static ensureSchema(): void {
		if (!this.signature || Object.prototype.hasOwnProperty.call(this, '_signatureParsed')) return;

		const parsed = CommandSignatureParser.parse(this.signature, this.helperDefinitions);
		const ownFlags = Object.prototype.hasOwnProperty.call(this, 'flags') ? this.flags : {};
		const ownArgs = Object.prototype.hasOwnProperty.call(this, 'args') ? this.args : {};
		this.flags = { ...parsed.flags, ...ownFlags };
		this.args = { ...parsed.args, ...ownArgs };
		Object.defineProperty(this, '_signatureParsed', { value: true });
	}

	async run(runOpts: CommandRunOption<C>): Promise<number | void> {
		(this.constructor as typeof CommandWithSignature).ensureSchema();

		return super.run(runOpts);
	}

	/**
	 * Convenience accessor for a parsed option value.
	 */
	protected option<T = string>(key: string): T | null;
	protected option<T = string>(key: string, defaultValue: T): NoInfer<T>;
	protected option<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
		return this.parser.flag(key, defaultValue as any) as any;
	}

	/**
	 * Convenience accessor for a parsed argument value.
	 */
	protected argument<T = string>(key: string): T | null;
	protected argument<T = string>(key: string, defaultValue: T): NoInfer<T>;
	protected argument<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
		return this.parser.argument(key, defaultValue as any) as any;
	}
}
