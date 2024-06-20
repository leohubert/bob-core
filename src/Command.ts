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


    protected option<T = string>(key: string, defaultValue: T | null = null): T | null {
        return this.parser.option(key) ?? defaultValue;
    }

    protected optionBoolean(key: string, defaultValue: boolean = false): boolean  {
        return this.parser.option(key) ?? defaultValue;
    }

    protected optionArray(key: string, defaultValue: string[] = []): string[] {
        const values = this.parser.option(key) as Array<string>
        if (values?.length) {
            return values;
        }
        return defaultValue;
    }

    protected optionNumber(key: string, defaultValue: number | null = null): number | null {
        return this.parser.option(key) ? parseInt(this.parser.option(key) as string) : defaultValue;
    }


    protected argument(key: string, defaultValue: any | null = null): any | null {
        return this.parser.argument(key) ?? defaultValue;
    }

    protected argumentArray(key: string, defaultValue: string[] = []): string[] {
        const values = this.parser.argument(key) as Array<string>
        if (values?.length) {
            return values;
        }
        return defaultValue;
    }

    protected argumentBoolean(key: string, defaultValue: boolean = false): boolean {
        return this.parser.argument(key) ?? defaultValue;
    }

    protected argumentNumber(key: string, defaultValue: number | null = null): number | null {
        return this.parser.argument(key) ? parseInt(this.parser.argument(key) as string) : defaultValue;
    }
}