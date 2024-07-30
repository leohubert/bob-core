import path from "path";
import {Cli} from "../src";
import {Command, CommandContext} from "./command";

class TestTestCommand extends Command {
    signature = 'scout:sync-index-settings'
    description = 'test test'

    protected async handle(): Promise<number | void> {
        const res = await this.ctx.bambooClient.getProjects()
        console.log(res)
        throw new Error("Method not implemented.");
    }
}

class TestOtherTestCommand extends Command {
    signature = 'test:other'
    description = 'other test'

    protected handle(): Promise<number | void> {
        throw new Error("Method not implemented.");
    }
}

async function main() {
    const cli = new Cli<CommandContext>({
        bambooClient: {
            getProjects: async () => {
                return [
                    {
                        name: 'Project 1'
                    },
                    {
                        name: 'Project 2'
                    }
                ]
            }
        }
    })

    await cli.withCommands(
        path.resolve(__dirname, './commands'),
        TestTestCommand,
        new TestOtherTestCommand(),
    )


    const command = process.argv.at(2)

    if (command) {
        return await cli.runCommand(command, ...process.argv.slice(3))
    }

    return await cli.runHelpCommand()
}

main()
    .then(process.exit)
    .catch(err => {
        console.error(err)
        process.exit(1)
    })

