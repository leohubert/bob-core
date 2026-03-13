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
		const ctor = this as typeof CommandWithSignature;
		const signature = ctor.signature ?? this.signature;

		return signature.split(/\s/)[0] || '';
	}

	async run(runOpts: CommandRunOption<C>): Promise<number | void> {
		const ctor = this.constructor as typeof CommandWithSignature;

		// Lazily parse signature once per subclass
		if (ctor.signature && !Object.prototype.hasOwnProperty.call(ctor, '_signatureParsed')) {
			const parsed = CommandSignatureParser.parse(ctor.signature, ctor.helperDefinitions);
			const ownFlags = Object.prototype.hasOwnProperty.call(ctor, 'flags') ? ctor.flags : {};
			const ownArgs = Object.prototype.hasOwnProperty.call(ctor, 'args') ? ctor.args : {};
			ctor.flags = { ...parsed.flags, ...ownFlags };
			ctor.args = { ...parsed.args, ...ownArgs };
			Object.defineProperty(ctor, '_signatureParsed', { value: true });
		}

		return super.run(runOpts);
	}

	protected option<T = string>(key: string): T | null;
	protected option<T = string>(key: string, defaultValue: T): NoInfer<T>;
	protected option<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
		return this.parser.flag(key, defaultValue as any) as any;
	}

	protected argument<T = string>(key: string): T | null;
	protected argument<T = string>(key: string, defaultValue: T): NoInfer<T>;
	protected argument<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
		return this.parser.argument(key, defaultValue as any) as any;
	}

	// Prompt utils

	async askForConfirmation(...opts: Parameters<typeof this.io.askForConfirmation>): ReturnType<typeof this.io.askForConfirmation> {
		return this.io.askForConfirmation(...opts);
	}

	async askForInput(...opts: Parameters<typeof this.io.askForInput>): ReturnType<typeof this.io.askForInput> {
		return this.io.askForInput(...opts);
	}

	async askForSelect(...opts: Parameters<typeof this.io.askForSelect>): ReturnType<typeof this.io.askForSelect> {
		return this.io.askForSelect(...opts);
	}

	newLoader(...opts: Parameters<typeof this.io.newLoader>): ReturnType<typeof this.io.newLoader> {
		return this.io.newLoader(...opts);
	}
}
