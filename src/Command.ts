import {CommandHelper} from "./CommandHelper";
import {Parser} from "./Parser";

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

    protected parser!: Parser;

    get command(): string {
        if (this.parser) {
            return this.parser.command;
        }
        return this.signature.split(' ')[0];
    }

    protected abstract handle(): Promise<void|number>;

    public async run(ctx: C, ...args: any[]): Promise<number> {
        this.ctx = ctx;
        this.parser = new Parser(this.signature, this.helperDefinitions, ...args);

        if (args.includes('--help') || args.includes('-h')) {
            return this.help.call(this)
        }

        this.parser.validate();

        return (await this.handle()) ?? 0;
    }

    protected option(key: string, defaultValue: any = null): string | null {
        return this.parser.option(key) ?? defaultValue;
    }

    protected argument(key: string, defaultValue?: any): string | null {
        return this.parser.argument(key) ?? defaultValue;
    }

}