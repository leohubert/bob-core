
export interface CommandOption<C> {
    option: string
    alias?: string[]

    defaultValue: any

    description?: string

    handler(this: C): Promise<number|void>;
}