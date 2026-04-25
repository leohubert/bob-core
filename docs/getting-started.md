# Getting Started

Welcome to BOB Core! This guide walks you from install to a running CLI in a few minutes.

## Installation

```bash
npm install bob-core
```

## Your first CLI

Create `cli.ts`:

```typescript
import { Cli } from 'bob-core';

const cli = new Cli({
  name: 'my-cli',
  version: '1.0.0',
});

await cli.withCommands('./commands');

const exitCode = await cli.runCommand(process.argv[2], ...process.argv.slice(3));
process.exit(exitCode);
```

## Your first command

Create `commands/greet.ts`:

```typescript
import { Command, Flags, Args, Parsed } from 'bob-core';

export default class GreetCommand extends Command {
  static command = 'greet';
  static description = 'Greet someone';

  static args = {
    name: Args.string({ required: true, description: 'Name to greet' }),
  };

  static flags = {
    shout: Flags.boolean({ description: 'Uppercase the greeting', alias: 's' }),
  };

  async handle(_ctx: any, { flags, args }: Parsed<typeof GreetCommand>) {
    let message = `Hello, ${args.name}!`;
    if (flags.shout) message = message.toUpperCase();
    this.logger.info(message);
  }
}
```

Commands are classes that extend `Command`. Static metadata (`command`, `description`, `args`, `flags`) describes the contract; `handle(ctx, parsed)` does the work. Inside `handle`, `this.logger` and `this.ux` are available.

## Run it

```bash
$ my-cli greet World
Hello, World!

$ my-cli greet World --shout
HELLO, WORLD!

$ my-cli --help
```

## Built-in help

A `help` command is registered automatically.

```bash
my-cli help          # list all commands
my-cli help greet    # show help for one command
my-cli greet --help  # equivalent
```

## Project structure

```
my-cli/
├── commands/
│   └── greet.ts
├── cli.ts
├── package.json
└── tsconfig.json
```

You can also register classes or instances directly instead of pointing at a directory — see [Creating Commands](./creating-commands.md).

## TypeScript configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "node16",
    "moduleResolution": "node16",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Running with build tools

```bash
# tsx (development)
npx tsx cli.ts greet World

# production build
tsc && node dist/cli.js greet World
```

## Next steps

- [Creating Commands](./creating-commands.md) — full command anatomy
- [Arguments & Options](./arguments-and-options.md) — `Flags` and `Args` builders
- [Interactive Prompts](./interactive-prompts.md) — input, select, confirm, loaders
- [Advanced Topics](./advanced.md) — context, custom resolvers, error handling
