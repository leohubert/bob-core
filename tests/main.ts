import path from "path";
import {Cli} from "../src";

export type BobTestContext = {
    bambooClient: {
        getProjects: () => Promise<any>
    }

}

async function main() {
    const cli = new Cli<BobTestContext>({
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

    await cli.loadCommandsPath(path.resolve(__dirname, './commands'))

    const commandToRun = process.argv.at(2) ?? 'help'

    return await cli.runCommand(commandToRun, ...process.argv.slice(3))
}

main()
    .then(process.exit)
    .catch(console.error)

