# Advanced Topics

## Context injection

Inject typed dependencies into every command via `Cli<C>` and `Command<C>`.

```typescript
// context.ts
export interface AppContext {
  config: { apiUrl: string };
  db: DatabaseClient;
}
```

```typescript
// cli.ts
import { Cli } from 'bob-core';
import type { AppContext } from './context.js';

const cli = new Cli<AppContext>({
  ctx: { config: { apiUrl: 'https://api.example.com' }, db: new DatabaseClient() },
  name: 'my-app',
  version: '1.0.0',
});
```

Inside a command, `ctx` is typed:

```typescript
import { Command, Parsed } from 'bob-core';
import type { AppContext } from '../context.js';

export default class FetchUsersCommand extends Command<AppContext> {
  static command = 'users:fetch';
  static description = 'Fetch users from the API';

  async handle(ctx: AppContext) {
    const res = await fetch(`${ctx.config.apiUrl}/users`);
    const users = await res.json();
    await ctx.db.saveUsers(users);
    this.logger.info(`Saved ${users.length} users`);
  }
}
```

## Custom command resolvers

Override how files in a `withCommands(path)` directory are turned into commands.

```typescript
import { Cli, type CommandResolver } from 'bob-core';

const resolver: CommandResolver = async (filePath) => {
  const mod = await import(filePath);
  return mod.default ?? null;
};

const cli = new Cli().withCommandResolver(resolver);
```

## Custom file importers

Override the dynamic-import step itself (e.g. for transpilation, telemetry, or alternate module formats).

```typescript
import { Cli, type FileImporter } from 'bob-core';

const importer: FileImporter = async (filePath) => {
  return await import(filePath);
};

const cli = new Cli().withFileImporter(importer);
```

## Command groups

Commands sharing a `static group` are listed together in help output. Use `:` in `static command` for namespacing.

```typescript
static command = 'db:migrate';
static group = 'database';
```

## Error handling

Subclass `ExceptionHandler` and override `Cli.newExceptionHandler` to customize how thrown errors are mapped to exit codes and messages.

```typescript
import { Cli, ExceptionHandler, Logger } from 'bob-core';

class CustomExceptionHandler extends ExceptionHandler {
  async handle(error: Error): Promise<number> {
    if (error.name === 'ValidationError') {
      this.logger.error('Validation failed:', error.message);
      return 1;
    }
    return super.handle(error);
  }
}

class MyCli extends Cli {
  protected newExceptionHandler(opts: { logger: Logger }) {
    return new CustomExceptionHandler(opts.logger);
  }
}
```

Built-in error classes (in `src/errors/`):

- `BobError` — base
- `CommandNotFoundError`
- `InvalidFlag`, `MissingRequiredFlagValue`
- `BadCommandFlag`, `BadCommandArgument`
- `MissingRequiredArgumentValue`, `TooManyArguments`
- `ValidationError`

## Returning exit codes

```typescript
async handle(_ctx, { args }) {
  if (!args.file) return 1;
  if (!exists(args.file)) return 2;
  return 0;
}
```

## Disabling interactive prompts

For CI/CD or non-interactive environments, set `static disablePrompting = true` on the command. Missing required values then throw instead of prompting.

```typescript
export default class DeployCommand extends Command {
  static command = 'deploy';
  static disablePrompting = true;
  // ...
}
```

## Custom logger

Provide any object implementing `LoggerContract`:

```typescript
import { Cli, type LoggerContract } from 'bob-core';

const logger: LoggerContract = {
  log:   (...a) => console.log(...a),
  info:  (...a) => console.info(...a),
  warn:  (...a) => console.warn(...a),
  error: (...a) => console.error(...a),
  debug: (...a) => console.debug(...a),
};

const cli = new Cli({ logger: logger as any });
```

## Custom help command

Override `Cli.newHelpCommand`:

```typescript
import { Cli, HelpCommand, type HelpCommandOptions } from 'bob-core';

class MyHelp extends HelpCommand {
  // override methods to customize output
}

class MyCli extends Cli {
  protected newHelpCommand(opts: HelpCommandOptions) {
    return new MyHelp(opts);
  }
}
```

## Command registry access

```typescript
const cli = new Cli();
await cli.withCommands('./commands');

const commands = cli.commandRegistry.getCommands();
const names    = cli.commandRegistry.getAvailableCommands();
cli.commandRegistry.registerCommand(MyCommand);
```

## Running commands programmatically

`Command#run` accepts either raw arg strings (which the parser will process) or already-parsed `flags`/`args`.

```typescript
import { Logger } from 'bob-core';
import GreetCommand from './commands/greet.js';

const cmd = new GreetCommand();

// Raw args — parser handles validation and prompting
await cmd.run({ ctx: {}, logger: new Logger(), args: ['World', '--shout'] });

// Pre-parsed
await cmd.run({
  ctx: {},
  logger: new Logger(),
  args: { name: 'World' },
  flags: { shout: true },
});
```

## Fuzzy command matching

If the user mistypes a command name, BOB Core suggests the closest match using `StringSimilarity` (Dice's coefficient).

```bash
$ my-cli deloy
Command "deloy" not found. Did you mean "deploy"?
```

You can use `StringSimilarity` directly:

```typescript
import { StringSimilarity } from 'bob-core';

const sim = new StringSimilarity();
const match = sim.findBestMatch('deloy', ['deploy', 'delete']);
// match.bestMatch.target === 'deploy'
```

## Best practices

1. Type your context — `Command<AppContext>` makes `ctx` autocompletable.
2. Use `preHandle` for auth and prerequisite checks; return non-zero to abort.
3. Group related commands with `:` and `static group`.
4. Set `static disablePrompting = true` for CI-only commands.
5. Use `Parsed<typeof YourCommand>` and `satisfies FlagsSchema` for full inference.

## Next steps

- [API Reference](./api-reference.md)
- [Examples](./examples.md)
- [Help System](./help-system.md)
