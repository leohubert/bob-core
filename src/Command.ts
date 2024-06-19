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

    protected option<T = string | number | boolean | string[] | number[]>(key: string): T | null
    protected option<T = string | number | boolean | string[] | number[]>(key: string, defaultValue: T): T
    protected option<T = string | number | boolean | string[] | number[]>(key: string, defaultValue: null ): T | null
    protected option(key: string, defaultValue: any = null): any {
        return this.parser.option(key) ?? defaultValue;
    }

    protected argument<T = string | number | boolean | string[] | number[]>(key: string): T | null
    protected argument<T = string | number | boolean | string[] | number[]>(key: string, defaultValue: T): T
    protected argument<T = string | number | boolean | string[] | number[]>(key: string, defaultValue: null): T | null
    protected argument<T = string | number | boolean | string[] | number[]>(key: string, defaultValue: T | null = null): T | null {
        return this.parser.argument(key) ?? defaultValue;
    }

}