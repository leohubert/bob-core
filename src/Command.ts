import {CommandHelper} from "./CommandHelper";
import {CommandParser} from "./CommandParser";

export type CommandExample = {
    description: string;
    command: string;
}

export abstract class Command<C = undefined> extends CommandHelper {
    abstract signature: string;
    abstract description: string;

    protected ctx!: C;

    protected helperDefinitions: { [key: string]: string } = {};

    protected commandsExamples: CommandExample[] = [];

    protected parser!: CommandParser;

    get command(): string {
        if (this.parser) {
            return this.parser.command;
        }
        return this.signature.split(' ')[0];
    }

    protected abstract handle(): Promise<void|number>;

    public async run(ctx: C, ...args: any[]): Promise<number> {
        this.ctx = ctx;
        this.parser = new CommandParser(this.signature, this.helperDefinitions, ...args);

        if (args.includes('--help') || args.includes('-h')) {
            return this.help.call(this)
        }

        this.parser.validate();

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
}