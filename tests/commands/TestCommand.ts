import {Command} from "../../src/Command";
import {BadParameter} from "../../src/errors/BadParameter";

export type TestCommandArgs = {
    user: string;
    option?: string;
}

export default class TestCommand extends Command {
    signature = 'test {user} {test: test description?} {--option|o|b} {--flag=} { --flag2 = 2}';
    description = 'test description'

    helperDefinitions = {
        user: 'user description',
        option: 'option description',
        flag: 'flag description',
        flag2: 'flag2 description'
    }

    commandsExamples = [
        {
            description: 'Example 1',
            command: 'test yayo --option'
        },
        {
            description: 'Example 2',
            command: 'test bite --flag=2'
        }
    ]

    protected async handle(): Promise<void> {
        const user = this.argument('user')
        if (user === 'yayo') {
            throw new BadParameter({
                param: 'user',
                reason: 'yayo is not allowed'
            })
        }

        console.log('test command', this.argument('user'), this.argument('test'))

        console.log('option', this.option('option'))

        console.log('flag', this.option('flag'))

        console.log('flag2', this.option('flag2'))
    }
}