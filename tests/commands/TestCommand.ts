import {Command} from "../../src";
import {BadParameter} from "../../src/errors/BadParameter";
import {BobTestContext} from "../main";

export default class TestCommand extends Command<BobTestContext> {
    signature = 'test {user} {test: test description?} {test2*?} {--option|o|b} {--flag=} {--arr=*} { --flag2 = 2}';
    description = 'test description'

    helperDefinitions = {
        user: 'user description',
        arr: 'arr description',
        '--option': 'option description',
        '--flag': 'flag description',
        '--flag2': 'flag2 description'
    }

    commandsExamples = [
        {
            description: 'Example 1',
            command: 'test yayo --option'
        },
        {
            description: 'Example 2',
            command: 'test anothervalue --flag=2'
        }
    ]

    protected async handle(): Promise<void> {
        let user = this.argument('user')
        if (user === 'yayo') {
            throw new BadParameter({
                param: 'user',
                reason: 'yayo is not allowed'
            })
        }

        const options = this.option('option')
        console.log('options', options)

        console.log('ctx', await this.ctx.bambooClient.getProjects())

        console.log('test command', this.argument('user'), this.argument('test'))

        console.log('variadic', this.argumentArray('test2'))

        console.log('option', this.optionBoolean('option'))

        console.log('flag', this.option('flag'))

        console.log('arr', this.option('arr'))

        console.log('flag2', this.option('flag2'))
    }
}