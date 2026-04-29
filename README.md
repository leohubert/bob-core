<div align="center">

```
  ____   ____  ____
 | __ ) / __ \| __ )
 |  _ \| |  | |  _ \
 | |_) | |  | | |_) |
 |____/ \____/|____/
```

# BOB Core

Type-safe CLI framework for TypeScript

[![npm version](https://img.shields.io/npm/v/bob-core.svg)](https://www.npmjs.com/package/bob-core)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

</div>

## Features

- Type-safe flags and args with full inference via `Flags` builders
- Interactive prompts built on `@inquirer/prompts` (input, select, confirm, search, password, file picker)
- Auto-generated help with grouped commands and fuzzy "did you mean?" suggestions
- Typed context injection for sharing dependencies across commands
- Dual CJS/ESM, minimal dependencies

## Installation

```bash
npm install bob-core
```

## Quick Start

### Define a command

```typescript
// commands/greet.ts
import { Command, Flags, Parsed } from 'bob-core';

export default class GreetCommand extends Command {
  static command = 'greet';
  static description = 'Greet someone';

  static flags = {
    shout: Flags.boolean({ description: 'Uppercase the greeting', alias: 's' }),
  };

  static args = {
    name: Flags.string({ description: 'Name to greet', required: true }),
  };

  async handle(_ctx: any, { flags, args }: Parsed<typeof GreetCommand>) {
    let message = `Hello, ${args.name}!`;
    if (flags.shout) message = message.toUpperCase();
    this.logger.info(message);
  }
}
```

### Wire it up

```typescript
// cli.ts
import { Cli } from 'bob-core';

const cli = new Cli({
  name: 'my-cli',
  version: '1.0.0',
});

await cli.withCommands('./commands');

const exitCode = await cli.runCommand(process.argv[2], ...process.argv.slice(3));
process.exit(exitCode);
```

### Run it

```bash
$ my-cli greet World
Hello, World!

$ my-cli greet World --shout
HELLO, WORLD!

$ my-cli --help
```

## Flags & Args

All builders share common options: `description`, `alias`, `required`, `default`, `multiple`, `help`, `parse`, `handler`, `ask`.

```typescript
import { Flags, FlagsSchema } from 'bob-core';

static flags = {
  name:      Flags.string({ required: true, description: 'Your name' }),
  count:     Flags.number({ min: 1, max: 10, default: 1 }),
  force:     Flags.boolean({ alias: 'f' }),
  level:     Flags.option({ options: ['debug', 'info', 'warn', 'error'] as const }),
  config:    Flags.file({ exists: true, description: 'Config file path' }),
  outDir:    Flags.directory({ exists: true }),
  endpoint:  Flags.url({ description: 'API endpoint' }),
  since:     Flags.custom<Date>({ parse: v => new Date(v), description: 'Start date' }),
} satisfies FlagsSchema;
```

| Builder | Parsed type | Extra options |
|---|---|---|
| `Flags.string()` | `string` | `secret` |
| `Flags.number()` | `number` | `min`, `max` |
| `Flags.boolean()` | `boolean` | |
| `Flags.option()` | union of `options` | `options` (readonly tuple) |
| `Flags.file()` | `string` | `exists` |
| `Flags.directory()` | `string` | `exists` |
| `Flags.url()` | `URL` | |
| `Flags.custom<T>()` | `T` | `parse` (required) |

`Args` is a separate builder set from `Flags` (it omits `boolean`) -- use it for semantic clarity when defining `static args`.

Use `satisfies FlagsSchema` on both `static flags` and `static args` to enable full type inference with `Parsed<typeof YourCommand>`.

## Interactive Prompts

All prompts are available via `this.ux` inside a command:

```typescript
async handle(ctx: AppContext, { flags }: Parsed<typeof SetupCommand>) {
  const name = await this.ux.askForInput('Project name:');
  const lang = await this.ux.askForSelect('Language:', ['TypeScript', 'JavaScript']);
  const confirm = await this.ux.askForConfirmation('Continue?');

  using loader = this.ux.newLoader('Creating project...');
  await createProject(name);
}
```

Available methods: `askForInput`, `askForPassword`, `askForNumber`, `askForSelect`, `askForCheckbox`, `askForSearch`, `askForConfirmation`, `askForToggle`, `askForList`, `askForEditor`, `askForRawList`, `askForExpand`, `askForFile`, `askForDirectory`, `askForFileSelector`, `table`, `keyValue`, `newProgressBar`, `newLoader`.

See [docs/interactive-prompts.md](./docs/interactive-prompts.md) for full API.

## Context Injection

Share dependencies across commands with typed context:

```typescript
interface AppContext {
  db: Database;
  config: Config;
}

const cli = new Cli<AppContext>({
  ctx: { db: new Database(), config: loadConfig() },
  name: 'my-app',
  version: '1.0.0',
});

// In your command:
export default class UsersCommand extends Command<AppContext> {
  static command = 'users:list';
  static description = 'List all users';

  async handle(ctx: AppContext) {
    const users = await ctx.db.getUsers();
    this.ux.table(users);
  }
}
```

## More Features

### preHandle

Run validation or setup before `handle()`. Return a non-zero number to abort execution.

```typescript
protected async preHandle() {
  if (!this.ctx.isAuthenticated) {
    this.logger.error('Not authenticated');
    return 1;
  }
}
```

### Shared flags via baseFlags

Override `static baseFlags` in a base class to add flags to every command:

```typescript
export abstract class BaseCommand extends Command<AppContext> {
  static override baseFlags: FlagsSchema = {
    ...Command.baseFlags,
    verbose: Flags.boolean({ description: 'Verbose output', alias: 'v' }),
  };
}
```

### Command groups

```typescript
static group = 'database';
```

Commands with the same group are displayed together in help output.

### Examples

```typescript
static examples = [
  { description: 'Run migrations', command: 'db:migrate --seed' },
  { description: 'Rollback last migration', command: 'db:migrate --rollback' },
];
```

## Documentation

- [Getting Started](./docs/getting-started.md) -- Installation and first CLI
- [Creating Commands](./docs/creating-commands.md) -- Class-based command definition
- [Arguments & Options](./docs/arguments-and-options.md) -- Type-safe flags and args
- [Interactive Prompts](./docs/interactive-prompts.md) -- Prompts and display utilities
- [Advanced Topics](./docs/advanced.md) -- Context, resolvers, error handling
- [Help System](./docs/help-system.md) -- Customizing help output
- [API Reference](./docs/api-reference.md) -- Complete API documentation
- [Examples](./docs/examples.md) -- Real-world examples

## License

ISC -- Leo Hubert
