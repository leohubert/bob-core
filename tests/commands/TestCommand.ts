import {Command} from "../../src/Command";

export type TestCommandArgs = {
    user: string;
    option?: string;
}

export default class TestCommand extends Command {
    signature = 'test {user} {test : test description?} {--option} {--flag= : flag description} { --flag2 = 2 : flag2 description }';
    description = 'test description'

    protected async handle(): Promise<void> {
        console.log('test command', this.argument('user'), this.argument('test'))

        console.log('option', this.option('option'))

        console.log('flag', this.option('flag'))

        console.log('flag2', this.option('flag2'))
    }
}