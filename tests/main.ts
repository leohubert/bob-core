import path from "path";
import {Cli} from "../src/Cli";
import HelpCommand from "../src/commands/HelpCommand";

async function main() {
    const cli = new Cli()

    await cli.loadCommandsPath(path.resolve(__dirname, './commands'))
    
    const helpCommand = new HelpCommand(cli.commandRegistry)
    cli.registerCommand(helpCommand)
    
    const commandToRun = process.argv.at(2) ?? helpCommand.command
    
    await cli.runCommand(commandToRun, ...process.argv.slice(3))
}

main()
    .then()
    .catch(console.error)

