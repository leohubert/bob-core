# Creating Commands

BOB Core offers two ways to create commands: the modern schema-based approach (recommended) and the signature-based approach.

## Modern Schema-Based Commands

The modern approach uses explicit schema definitions with full TypeScript type safety.

### Basic Command

```typescript
import { Command } from 'bob-core';

export default new Command('hello', {
  description: 'Say hello to the world'
}).handler(() => {
  console.log('Hello, World!');
});
```

### With Arguments and Options

```typescript
import { Command } from 'bob-core';

export default new Command('deploy', {
  description: 'Deploy an application',
  arguments: {
    environment: 'string'
  },
  options: {
    force: {
      type: 'boolean',
      default: false,
      description: 'Force deployment'
    },
    region: {
      type: 'string',
      default: 'us-east-1',
      description: 'AWS region'
    }
  }
}).handler((ctx, { arguments: args, options }) => {
  console.log(`Deploying to ${args.environment}`);
  console.log(`Region: ${options.region}`);
  console.log(`Force: ${options.force}`);
});
```

### Using .options() and .arguments() Builders

You can build schemas progressively:

```typescript
import { Command } from 'bob-core';

const command = new Command('process')
  .arguments({
    filename: 'string'
  })
  .options({
    verbose: { type: 'boolean', default: false }
  })
  .handler((ctx, { arguments: args, options }) => {
    console.log(`Processing ${args.filename}`);
    if (options.verbose) {
      console.log('Verbose mode enabled');
    }
  });

export default command;
```

### Pre-Handlers

Execute logic before the main handler:

```typescript
export default new Command('authenticate')
  .preHandler(async (ctx) => {
    // Check authentication
    if (!ctx.isAuthenticated) {
      console.error('Not authenticated');
      return 1; // Return non-zero to stop execution
    }
    // Return nothing or 0 to continue
  })
  .handler((ctx) => {
    console.log('Authenticated successfully');
  });
```

### Command Groups

Organize commands with groups (using `:` separator):

```typescript
export default new Command('db:migrate', {
  description: 'Run database migrations',
  group: 'Database'
}).handler(() => {
  // Migration logic
});
```

## Signature-Based Commands

The signature-based approach uses a string signature to define arguments and options.

### Basic Command

```typescript
import { CommandWithSignature } from 'bob-core';

export default class HelloCommand extends CommandWithSignature {
  signature = 'hello';
  description = 'Say hello to the world';

  protected async handle() {
    console.log('Hello, World!');
  }
}
```

### Signature Syntax

The signature format: `command-name {arg1} {arg2} {--option1} {--option2}`

**Arguments:**
- `{arg}` - Required argument
- `{arg?}` - Optional argument
- `{arg=default}` - Argument with default value
- `{arg*}` - Variadic argument (array)
- `{arg*?}` - Optional variadic argument

**Options:**
- `{--option}` - Boolean option (default: false)
- `{--option=}` - String option (default: null)
- `{--option=value}` - Option with default value
- `{--option=*}` - Array option
- `{--option|o}` - Option with alias
- `{--option|o|opt}` - Option with multiple aliases

### Complete Example

```typescript
import { CommandWithSignature } from 'bob-core';

export default class DeployCommand extends CommandWithSignature {
  signature = 'deploy {environment} {--force} {--region=us-east-1}';
  description = 'Deploy an application';

  // Optional: Define help text for arguments/options
  helperDefinitions = {
    environment: 'The environment to deploy to',
    '--force': 'Force deployment without confirmation',
    '--region': 'AWS region for deployment'
  };

  protected async handle() {
    const environment = this.argument<string>('environment');
    const force = this.option<boolean>('force');
    const region = this.option<string>('region');

    console.log(`Deploying to ${environment}`);
    console.log(`Region: ${region}`);
    console.log(`Force: ${force}`);
  }
}
```

### Accessing Arguments and Options

```typescript
// Get argument value
const name = this.argument<string>('name');

// Get argument with fallback
const name = this.argument<string>('name', 'Anonymous');

// Get option value
const verbose = this.option<boolean>('verbose');

// Get option with fallback
const port = this.option<number>('port', 3000);
```

### Helper Methods

CommandWithSignature provides additional helper methods:

```typescript
protected async handle() {
  // Confirmation prompt
  const confirmed = await this.askForConfirmation('Continue?');

  // Text input
  const name = await this.askForInput('Enter your name:');

  // Select from options
  const env = await this.askForSelect('Environment:', ['dev', 'prod']);

  // Loader/spinner
  const loader = this.newLoader('Processing...');
  // ... do work
  loader.stop();
}
```

## Class-based vs Function-based Commands

### Exporting as Class

```typescript
export default class MyCommand extends CommandWithSignature {
  // ...
}
```

### Exporting as Instance

```typescript
export default new Command('my-command')
  .handler(() => {
    // ...
  });
```

### Registering Directly

```typescript
import { Cli } from 'bob-core';
import MyCommand from './commands/MyCommand';

const cli = new Cli();

// Register a class
await cli.withCommands(MyCommand);

// Register an instance
await cli.withCommands(new MyCommand());

// Load from directory
await cli.withCommands('./commands');
```

## Command Return Values

Commands can return exit codes:

```typescript
.handler((ctx, { options }) => {
  if (options.invalid) {
    return 1; // Non-zero for errors
  }
  // 0 or undefined for success
});
```

## Async Commands

All handlers support async/await:

```typescript
.handler(async (ctx, { arguments: args }) => {
  const result = await fetch(`https://api.example.com/${args.id}`);
  const data = await result.json();
  console.log(data);
});
```

## Next Steps

- [Arguments & Options](./arguments-and-options.md) - Deep dive into parameter handling
- [Interactive Prompts](./interactive-prompts.md) - Build interactive commands
- [Advanced Topics](./advanced.md) - Context, error handling, and more
