export interface CommandOption<C> {
    option: string
    alias?: string[]

    defaultValue: string | boolean | Array<string> | null

    description?: string

    handler(this: C): Promise<number|void>;
}