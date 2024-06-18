import {CommandHelper} from "./CommandHelper";
import {Parser} from "./Parser";

export abstract class Command extends CommandHelper {
    abstract signature: string;
    abstract description: string;

    private parser!: Parser;

    get command(): string {
        return this.signature.split(' ')[0];
    }

    protected abstract handle(): Promise<void|number>;

    public async run(...args: any[]): Promise<number> {
        this.parser = new Parser(this.signature, ...args);

        if (args.includes('--help') || args.includes('-h')) {
            return this.help()
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

    public signatures() {
        return this.parser.signatures()
    }
}