import {CommandSignatureParser} from "@/src/CommandSignatureParser.js";
import {HelpOption} from "@/src/options/index.js";
import {CommandOption} from "@/src/contracts/index.js";
import {CommandIO} from "@/src/CommandIO.js";

export type CommandExample = {
    description: string;
    command: string;
}

export abstract class LegacyCommand<C = any> {
    abstract signature: string;
    abstract description: string;

    protected ctx!: C;

    protected helperDefinitions: { [key: string]: string } = {};

    protected commandsExamples: CommandExample[] = [];

    protected parser!: CommandSignatureParser;
	protected io!: CommandIO;


    protected abstract handle(): Promise<void|number>;

	protected preHandle?(): Promise<void|number>;

    protected get CommandParserClass(): typeof CommandSignatureParser {
        return CommandSignatureParser;
    }

	protected get CommandIOClass(): typeof CommandIO {
		return CommandIO;
	}

    protected defaultOptions(): CommandOption<LegacyCommand<C>>[] {
        return [new HelpOption]
    }

    get command(): string {
        if (this.parser) {
            return this.parser.command;
        }
        return this.signature.split(' ')[0];
    }

    public async run(ctx: C, ...args: any[]): Promise<number> {
        this.ctx = ctx;
        const defaultOptions = this.defaultOptions();
		this.io = new this.CommandIOClass();
        this.parser = new this.CommandParserClass(this.io, this.signature, this.helperDefinitions, defaultOptions, ...args);

        for (const option of defaultOptions) {
            if (this.parser.option(option.option)) {
                const code = await option.handler.call(this)
                if (code && code !== 0) {
                    return code;
                }
            }
        }

        await this.parser.validate();

		const preHandleResult = this.preHandle ? await this.preHandle() : null;
		if (preHandleResult && preHandleResult !== 0) {
			return preHandleResult;
		}

        return (await this.handle()) ?? 0;
    }

    protected setOption(name: string, value: any) {
        this.parser.setOption(name, value);
    }

    protected setArgument(name: string, value: any) {
        this.parser.setArgument(name, value);
    }

    protected option<T = string>(key: string): T | null
    protected option<T = string>(key: string, defaultValue: T): NoInfer<T>
    protected option<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
        return this.parser.option(key) ?? defaultValue;
    }

    protected optionBoolean(key: string, defaultValue: boolean = false): boolean  {
        return this.parser.option(key) ?? defaultValue;
    }

    protected optionArray<T = string>(key: string, defaultValue: Array<T> = []): Array<NoInfer<T>> {
        const values = this.parser.option(key) as Array<T>
        if (!Array.isArray(values)) {
            throw new Error(`Option ${key} is not an array`);
        }
        if (values.length) {
            return values;
        }
        return defaultValue;
    }

    protected optionNumber(key: string): number | null
    protected optionNumber(key: string, defaultValue: number): number
    protected optionNumber(key: string, defaultValue: number | null = null): number | null {
        const value = this.parser.option(key);
        if (!value) {
            return defaultValue;
        }
        if (typeof value === 'number') {
            return value;
        }

        return parseInt(value);
    }


    protected argument<T = string>(key: string): T | null
    protected argument<T = string>(key: string, defaultValue: T): NoInfer<T>
    protected argument<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
        return this.parser.argument(key) ?? defaultValue;
    }

    protected argumentArray<T = string>(key: string, defaultValue: Array<any> = []): Array<T> {
        const values = this.parser.argument(key) as Array<T>
        if (!Array.isArray(values)) {
            throw new Error(`Argument ${key} is not an array`);
        }

        if (values?.length) {
            return values;
        }
        return defaultValue;
    }

    protected argumentBoolean(key: string, defaultValue: boolean = false): boolean {
        return this.parser.argument(key) ?? defaultValue;
    }

    protected argumentNumber(key: string, defaultValue: number | null = null): number | null {
        const value = this.parser.argument(key);
        if (!value) {
            return defaultValue;
        }
        if (typeof value === 'number') {
            return value;
        }

        return parseInt(value);
    }

	/**
	 * Prompt utils
	 */

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