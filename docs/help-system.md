# Help System

BOB Core auto-generates help output from your command metadata. A `help` command is registered automatically; `--help` and `-h` work on every command.

## Triggering help

```bash
my-cli help              # list all commands
my-cli help deploy       # show help for one command
my-cli deploy --help     # equivalent
my-cli deploy -h         # equivalent
```

## CLI metadata

`Cli` constructor options surface in the help header:

```typescript
const cli = new Cli({ name: 'my-app', version: '1.0.0' });
```

```
my-app 1.0.0

Usage:
  command [options] [arguments]

Available commands:
  ...
```

## Command metadata

All help text comes from `static` fields on the command:

```typescript
import { Command, Flags, Args } from 'bob-core';

export default class DeployCommand extends Command {
  static command = 'deploy';
  static description = 'Deploy an application';
  static group = 'Deploy';
  static aliases = ['ship'];

  static args = {
    environment: Args.string({
      required: true,
      description: 'Target environment (dev, staging, prod)',
    }),
  };

  static flags = {
    force: Flags.boolean({ alias: 'f', description: 'Skip confirmation' }),
    region: Flags.string({ default: 'us-east-1', description: 'AWS region' }),
  };

  static examples = [
    { description: 'Deploy to production', command: 'my-app deploy prod' },
    { description: 'Deploy with custom region', command: 'my-app deploy staging --region=eu-west-1' },
  ];
}
```

## Per-command help output

```
Description:
  Deploy an application

Usage:
  deploy <environment> [options]

Arguments:
  environment           Target environment (dev, staging, prod)

Options:
  --force, -f           Skip confirmation (boolean) [default: false]
  --region              AWS region (string) [default: us-east-1]
  --help, -h            Display help for the given command (boolean)

Examples:
  Deploy to production
    my-app deploy prod

  Deploy with custom region
    my-app deploy staging --region=eu-west-1
```

## Grouped commands

Commands with a shared `static group` are clustered together. Use `:` in `static command` for namespacing — by convention, the part before the colon doubles as the group name in many CLIs, but you can set `static group` explicitly to anything.

```typescript
static command = 'db:migrate';
static group = 'Database';
```

```
Available commands:

Database:
  db:migrate        Run migrations
  db:seed           Seed database

Cache:
  cache:clear       Clear cache
```

## Argument & option display

| Notation | Meaning |
|---|---|
| `<arg>` | Required argument |
| `[arg]` | Optional argument |
| `[arg...]` | Variadic argument |
| `[default: …]` | Default value |
| `--flag, -f` | Flag with alias |
| `(boolean)` / `(string)` / etc. | Parsed type |

## Hiding commands

```typescript
static hidden = true;
```

The command still runs; it's just not listed in the index.

## Customizing help

Subclass `HelpCommand` and override `Cli.newHelpCommand`:

```typescript
import { Cli, HelpCommand, type HelpCommandOptions } from 'bob-core';

class CustomHelp extends HelpCommand {
  // override rendering methods here
}

class MyCli extends Cli {
  protected newHelpCommand(opts: HelpCommandOptions) {
    return new CustomHelp(opts);
  }
}
```

## Best practices

1. Always set `static description`.
2. Add `description` to every flag and arg.
3. Provide `static examples` for non-trivial commands — examples drive adoption.
4. Document aliases by listing them in the description when ambiguous.
5. Group related commands with `:` and `static group`.

## Next steps

- [API Reference](./api-reference.md)
- [Examples](./examples.md)
