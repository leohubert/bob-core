import path from "path";
import {Cli} from "../src/Cli";

async function main() {
    const cli = new Cli()

    await cli.loadCommandsPath(path.resolve(__dirname, './commands'))

    const commandToRun = process.argv.at(2) ?? 'help'

    return await cli.runCommand(commandToRun, ...process.argv.slice(3))
}

main()
    .then(process.exit)
    .catch(console.error)

