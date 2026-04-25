# Creating Commands

A BOB Core command is a class extending `Command`, with static metadata describing its contract and an async `handle()` method doing the work.

```typescript
import { Command, Flags, Args, Parsed } from 'bob-core';

export default class HelloCommand extends Command {
  static command = 'hello';
  static description = 'Say hello to the world';

  async handle() {
    this.logger.info('Hello, World!');
  }
}
```

> Looking for the old signature-string syntax (`CommandWithSignature`)? See [legacy/README.md](./legacy/README.md). It still works, but new code should use the schema-based form below.

## Anatomy

| Field | Type | Purpose |
|---|---|---|
| `static command` | `string` | Command name (use `:` for grouping, e.g. `db:migrate`) |
| `static description` | `string` | One-line description shown in help |
| `static args` | `ArgsSchema` | Positional arguments (use `Args` builders) |
| `static flags` | `FlagsSchema` | Named flags / options (use `Flags` builders) |
| `static examples` | `CommandRunExample[]` | Examples shown in `--help` |
| `static group` | `string` | Group label for help output |
| `static aliases` | `string[]` | Alternate names for the command |
| `static hidden` | `boolean` | Hide from help listings |

Inside the class:

- `this.logger` — leveled logger (`debug`, `info`, `warn`, `error`)
- `this.ux` — interactive prompts and display helpers (see [interactive-prompts.md](./interactive-prompts.md))
- `this.ctx` — typed context injected by `Cli`
- `this.parser` — the underlying `CommandParser`

## With arguments and flags

```typescript
import { Command, Flags, Args, Parsed } from 'bob-core';

export default class DeployCommand extends Command {
  static command = 'deploy';
  static description = 'Deploy an application';

  static args = {
    environment: Args.string({ required: true, description: 'Target environment' }),
  };

  static flags = {
    force: Flags.boolean({ description: 'Skip confirmation', alias: 'f' }),
    region: Flags.string({ default: 'us-east-1', description: 'AWS region' }),
  };

  async handle(_ctx: any, { flags, args }: Parsed<typeof DeployCommand>) {
    this.logger.info(`Deploying to ${args.environment} in ${flags.region}`);
    if (!flags.force) {
      const ok = await this.ux.askForConfirmation('Continue?');
      if (!ok) return 1;
    }
    // ...
  }
}
```

`Parsed<typeof YourCommand>` infers the exact shape of `flags` and `args` from your schemas.

## `preHandle` hook

Run validation or setup before `handle()`. Return a non-zero number to abort.

```typescript
export default class ProtectedCommand extends Command<AppContext> {
  static command = 'protected';
  static description = 'Requires authentication';

  protected async preHandle() {
    if (!this.ctx.isAuthenticated) {
      this.logger.error('Not authenticated');
      return 1;
    }
  }

  async handle(ctx: AppContext) {
    // ...
  }
}
```

## Command groups

Commands sharing a `static group` are listed together in help output. Use `:` in command names for namespacing.

```typescript
static command = 'db:migrate';
static group = 'database';
```

## Aliases

```typescript
static command = 'remove';
static aliases = ['rm', 'delete'];
```

## Examples

Examples appear under each command's `--help`.

```typescript
static examples = [
  { description: 'Run all migrations', command: 'db:migrate' },
  { description: 'Roll back the last migration', command: 'db:migrate --rollback' },
];
```

## Shared flags via `baseFlags`

Override `static baseFlags` in a base class to add flags to every command that extends it. The default `baseFlags` includes `--help`; spread it to keep that behavior.

```typescript
import { Command, Flags, FlagsSchema } from 'bob-core';

export abstract class BaseCommand extends Command<AppContext> {
  static override baseFlags: FlagsSchema = {
    ...Command.baseFlags,
    verbose: Flags.boolean({ description: 'Verbose output', alias: 'v' }),
  };
}
```

## Static configuration

```typescript
static disableDefaultOptions = false; // skip baseFlags (e.g. --help) entirely
static disablePrompting = false;      // never prompt for missing required values
static allowUnknownFlags = false;     // tolerate unknown flags instead of erroring
static strictMode = false;            // strict ordering / no-extra-args
static hidden = false;                // hide from help
```

## Registering commands

```typescript
import { Cli } from 'bob-core';
import GreetCommand from './commands/greet.js';

const cli = new Cli({ name: 'my-cli', version: '1.0.0' });

// From a directory
await cli.withCommands('./commands');

// As a class
await cli.withCommands(GreetCommand);

// As an instance
await cli.withCommands(new GreetCommand());

// Mixed
await cli.withCommands('./commands', GreetCommand);
```

## Return values

`handle()` may return a number to use as the process exit code. Returning nothing (or `0`) is treated as success.

```typescript
async handle(_ctx, { args }) {
  if (!args.file) return 1;
  if (!fileExists(args.file)) return 2;
  return 0;
}
```

`async/await` is fully supported throughout `handle()` and `preHandle()`.

## Next steps

- [Arguments & Options](./arguments-and-options.md)
- [Interactive Prompts](./interactive-prompts.md)
- [Advanced Topics](./advanced.md)
