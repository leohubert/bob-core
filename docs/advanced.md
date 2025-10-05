# Advanced Topics

Learn about advanced features and patterns in BOB Core.

## Context Injection

Context allows you to inject dependencies, configuration, or shared state into your commands.

### Defining Context Type

```typescript
// context.ts
export interface AppContext {
  config: {
    apiUrl: string;
    timeout: number;
  };
  database: DatabaseClient;
  logger: Logger;
  user?: User;
}
```

### Creating CLI with Context

```typescript
import { Cli } from 'bob-core';
import { AppContext } from './context';

const context: AppContext = {
  config: {
    apiUrl: 'https://api.example.com',
    timeout: 30000
  },
  database: new DatabaseClient(),
  logger: new Logger()
};

const cli = new Cli<AppContext>({
  ctx: context,
  name: 'my-app',
  version: '1.0.0'
});
```

### Using Context in Commands

**Modern Commands:**
```typescript
import { Command } from 'bob-core';
import { AppContext } from './context';

export default new Command<AppContext>('fetch-users', {
  description: 'Fetch users from API'
}).handler(async (ctx, { options }) => {
  // Access context
  const response = await fetch(ctx.config.apiUrl + '/users', {
    timeout: ctx.config.timeout
  });

  const users = await response.json();
  await ctx.database.saveUsers(users);

  ctx.logger.info(`Saved ${users.length} users`);
});
```

**Signature-Based Commands:**
```typescript
export default class FetchUsersCommand extends CommandWithSignature<AppContext> {
  signature = 'fetch-users';
  description = 'Fetch users from API';

  protected async handle() {
    // Access via this.ctx
    const response = await fetch(this.ctx.config.apiUrl + '/users');
    const users = await response.json();

    await this.ctx.database.saveUsers(users);
    this.ctx.logger.info(`Saved ${users.length} users`);
  }
}
```

## Custom Command Resolvers

Override how commands are loaded from files.

```typescript
import { Cli, CommandResolver } from 'bob-core';

const customResolver: CommandResolver = async (filePath: string) => {
  const module = await import(filePath);

  // Custom logic to extract command
  if (module.command) {
    return module.command;
  }

  if (module.default) {
    return typeof module.default === 'function'
      ? new module.default()
      : module.default;
  }

  return null;
};

const cli = new Cli();
cli.withCommandResolver(customResolver);
```

## Custom File Importers

Control how files are imported.

```typescript
import { Cli, FileImporter } from 'bob-core';

const customImporter: FileImporter = async (filePath: string) => {
  // Add custom import logic
  console.log(`Loading command from ${filePath}`);

  // Use dynamic import
  return await import(filePath);
};

const cli = new Cli();
cli.withFileImporter(customImporter);
```

## Command Groups

Organize commands with groups using `:` separator.

```typescript
// commands/db/migrate.ts
export default new Command('db:migrate', {
  description: 'Run database migrations',
  group: 'Database'
}).handler(async () => {
  // Migration logic
});

// commands/db/seed.ts
export default new Command('db:seed', {
  description: 'Seed database',
  group: 'Database'
}).handler(async () => {
  // Seeding logic
});

// commands/cache/clear.ts
export default new Command('cache:clear', {
  description: 'Clear cache',
  group: 'Cache'
}).handler(async () => {
  // Cache clearing logic
});
```

Help output will group commands:
```
Database:
  db:migrate    Run database migrations
  db:seed       Seed database

Cache:
  cache:clear   Clear cache
```

## Error Handling

### Custom Error Handling

```typescript
import { Cli, ExceptionHandler } from 'bob-core';

class CustomExceptionHandler extends ExceptionHandler {
  async handle(error: Error): Promise<number> {
    if (error.name === 'ValidationError') {
      this.logger.error('Validation failed:', error.message);
      return 1;
    }

    if (error.name === 'NetworkError') {
      this.logger.error('Network error:', error.message);
      return 2;
    }

    // Default handling
    return super.handle(error);
  }
}

// Use custom exception handler
class MyCli extends Cli {
  protected newExceptionHandler(opts: { logger: Logger }) {
    return new CustomExceptionHandler(opts.logger);
  }
}
```

### Error Codes

Return specific exit codes from commands:

```typescript
.handler((ctx, { arguments: args }) => {
  if (!args.file) {
    return 1; // Missing argument
  }

  if (!fileExists(args.file)) {
    return 2; // File not found
  }

  if (!canProcess(args.file)) {
    return 3; // Cannot process
  }

  // Success
  return 0;
});
```

## Disabling Interactive Prompts

For CI/CD or non-interactive environments:

```typescript
// Disable for specific command
const command = new Command('deploy')
  .disablePrompting()
  .arguments({ env: 'string' })
  .handler(async (ctx, { arguments: args }) => {
    // Will throw error instead of prompting if env is missing
  });

// Disable via CommandParser
// This happens automatically when no TTY is detected
```

## Custom Logger

Provide a custom logger implementation:

```typescript
import { Logger, LoggerContract } from 'bob-core';

class CustomLogger implements LoggerContract {
  log(...args: any[]): void {
    // Custom logging
    myLogger.info(args);
  }

  info(...args: any[]): void {
    myLogger.info(args);
  }

  warn(...args: any[]): void {
    myLogger.warn(args);
  }

  error(...args: any[]): void {
    myLogger.error(args);
  }

  debug(...args: any[]): void {
    myLogger.debug(args);
  }
}

const cli = new Cli({
  logger: new CustomLogger()
});
```

## Custom Help Command

Override the default help command:

```typescript
import { Cli, HelpCommand } from 'bob-core';

class MyHelpCommand extends HelpCommand {
  // Customize help display
}

class MyCli extends Cli {
  protected newHelpCommand(opts) {
    return new MyHelpCommand(opts);
  }
}
```

## Command Registry Access

Access registered commands programmatically:

```typescript
const cli = new Cli();
await cli.withCommands('./commands');

// Get all command names
const commandNames = cli.commandRegistry.getAvailableCommands();

// Get all command instances
const commands = cli.commandRegistry.getCommands();

// Register command manually
cli.commandRegistry.registerCommand(myCommand);
```

## Running Commands Programmatically

```typescript
import { Command } from 'bob-core';

const command = new Command('greet', {
  arguments: { name: 'string' }
}).handler((ctx, { arguments: args }) => {
  console.log(`Hello, ${args.name}!`);
});

// Run with parsed options
await command.run({
  ctx: {},
  logger: new Logger(),
  arguments: { name: 'John' },
  options: {}
});

// Run with raw args (will be parsed)
await command.run({
  ctx: {},
  logger: new Logger(),
  args: ['John', '--verbose']
});
```

## Pre-Handlers

Execute logic before the main handler:

```typescript
export default new Command('deploy')
  .preHandler(async (ctx) => {
    // Check authentication
    if (!ctx.isAuthenticated) {
      console.error('Not authenticated');
      return 1; // Stop execution
    }

    // Check prerequisites
    if (!await checkPrerequisites()) {
      console.error('Prerequisites not met');
      return 1;
    }

    // Continue to main handler
  })
  .handler(async (ctx, { arguments: args }) => {
    // Main deployment logic
  });
```

## Fuzzy Command Matching

BOB Core automatically suggests similar commands:

```bash
$ node cli.js deloy  # Typo
Command "deloy" not found.
Do you want to run "deploy" instead? (Y/n)
```

Customize similarity threshold or behavior:

```typescript
// Built-in - uses string-similarity library
// Threshold: 0.3 for multiple matches, 0.7 for single match
```

## Type-Safe Command Options

Use TypeScript generics for full type safety:

```typescript
interface MyOptions {
  verbose: { type: 'boolean'; default: false };
  output: { type: 'string'; required: true };
}

interface MyArgs {
  file: 'string';
}

export default new Command<AppContext, MyOptions, MyArgs>('process', {
  arguments: { file: 'string' },
  options: {
    verbose: { type: 'boolean', default: false },
    output: { type: 'string', required: true }
  }
}).handler((ctx, { arguments: args, options }) => {
  // args.file is typed as string
  // options.verbose is typed as boolean
  // options.output is typed as string
});
```

## Best Practices

1. **Use Context for Dependency Injection** - Pass database clients, configs, etc. through context
2. **Return Meaningful Exit Codes** - Use different codes for different error types
3. **Handle Errors Gracefully** - Provide helpful error messages
4. **Disable Prompts in CI** - Use `.disablePrompting()` for automated environments
5. **Group Related Commands** - Use `:` separator for logical grouping
6. **Type Your Context** - Define a TypeScript interface for your context
7. **Validate Early** - Use pre-handlers for authentication and prerequisite checks

## Next Steps

- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](./examples.md) - Real-world examples
- [Help System](./help-system.md) - Customize help output
