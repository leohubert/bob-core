<div align="center">

```
  ____   ____  ____
 | __ ) / __ \| __ )
 |  _ \| |  | |  _ \
 | |_) | |  | | |_) |
 |____/ \____/|____/
```

# BOB Core

**Your Bash Operation Buddy** 💪

*Build powerful TypeScript CLIs with type-safe commands and beautiful interactive prompts*

[![npm version](https://img.shields.io/npm/v/bob-core.svg)](https://www.npmjs.com/package/bob-core)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Examples](#examples)

</div>

---

## Features

✨ **Type-Safe Commands** - Full TypeScript support with type inference for arguments and options  
🎯 **Declarative API** - Define commands with simple schemas or string signatures  
💬 **Interactive Prompts** - Built-in support for confirmations, selections, inputs, and more   
🎨 **Beautiful Help** - Automatically generated, well-formatted help documentation  
🔍 **Smart Suggestions** - Fuzzy matching suggests similar commands when you make typos  
📦 **Zero Config** - Works out of the box with sensible defaults  
🚀 **Dual Module Support** - Both CommonJS and ESM supported  
⚡️ **Fast & Lightweight** - Minimal dependencies, maximum performance  

---

## Installation

```bash
npm install bob-core
```

```bash
yarn add bob-core
```

```bash
pnpm add bob-core
```

---

## Quick Start

### Create your CLI

```typescript
// cli.ts
import { Cli } from 'bob-core';

const cli = new Cli({
  name: 'my-cli',
  version: '1.0.0'
});

await cli.withCommands('./commands');

const exitCode = await cli.runCommand(process.argv[2], ...process.argv.slice(3));
process.exit(exitCode);
```

### Create a Command

**Modern Schema-Based (Recommended):**

```typescript
// commands/greet.ts
import { Command } from 'bob-core';

export default new Command('greet', {
  description: 'Greet a user',
  arguments: {
    name: 'string'
  },
  options: {
    enthusiastic: {
      type: 'boolean',
      alias: ['e'],
      default: false,
      description: 'Add enthusiasm!'
    }
  }
}).handler((ctx, { arguments: args, options }) => {
  const greeting = `Hello, ${args.name}${options.enthusiastic ? '!' : '.'}`;
  console.log(greeting);
});
```

**Modern Class-Based:**

```typescript
// commands/greet.ts
import { Command, CommandHandlerOptions, OptionsSchema } from 'bob-core';

const GreetOptions = {
  enthusiastic: {
    type: 'boolean',
    alias: ['e'],
    default: false,
    description: 'Add enthusiasm!'
  }
} satisfies OptionsSchema;
type GreetOptions = typeof GreetOptions;

const GreetArguments = {
  name: 'string'
} satisfies OptionsSchema;
type GreetArguments = typeof GreetArguments;

export default class GreetCommand extends Command<any, GreetOptions, GreetArguments> {
  constructor() {
    super('greet', {
      description: 'Greet a user',
      options: GreetOptions,
      arguments: GreetArguments
    });
  }

  handle(ctx: any, opts: CommandHandlerOptions<GreetOptions, GreetArguments>) {
    const greeting = `Hello, ${opts.arguments.name}${opts.options.enthusiastic ? '!' : '.'}`;
    console.log(greeting);
  }
}
```

**Signature-Based:**

```typescript
// commands/greet.ts
import { CommandWithSignature } from 'bob-core';

export default class GreetCommand extends CommandWithSignature {
  signature = 'greet {name} {--enthusiastic|-e}';
  description = 'Greet a user';

  protected async handle() {
    const name = this.argument<string>('name');
    const enthusiastic = this.option<boolean>('enthusiastic');

    const greeting = `Hello, ${name}${enthusiastic ? '!' : '.'}`;
    console.log(greeting);
  }
}
```

### Run It

```bash
$ node cli.js greet John
Hello, John.

$ node cli.js greet Jane --enthusiastic
Hello, Jane!

$ node cli.js help greet
Description:
  Greet a user

Usage:
  greet <name> [options]

Arguments:
  name                 (string)

Options:
  --enthusiastic, -e   Add enthusiasm! (boolean) [default: false]
  --help, -h          Display help for the given command
```

---

## Interactive Prompts

Build beautiful interactive CLIs with built-in prompts:

```typescript
import { Command, CommandHandlerOptions, OptionsSchema } from 'bob-core';

export default class SetupCommand extends Command<any, OptionsSchema, OptionsSchema> {
  constructor() {
    super('setup', {
      description: 'Interactive project setup'
    });
  }

  async handle(ctx: any, opts: CommandHandlerOptions<OptionsSchema, OptionsSchema>) {
    // Text input
    const name = await this.io.askForInput('Project name:');

    // Confirmation
    const useTypeScript = await this.io.askForConfirmation('Use TypeScript?', true);

    // Selection
    const framework = await this.io.askForSelect('Framework:', [
      { title: 'React', value: 'react' },
      { title: 'Vue', value: 'vue' },
      { title: 'Svelte', value: 'svelte' }
    ]);

    // Multi-select
    const features = await this.io.askForSelect(
      'Features:',
      ['ESLint', 'Prettier', 'Testing'],
      { type: 'multiselect' }
    );

    // Spinner/loader
    using loader = this.io.newLoader('Creating project...');
    await createProject({ name, framework, features });
    loader.stop();

    this.io.info('✅ Project created!');
  }
}
```

---

## Context Injection

Pass shared dependencies and configuration to your commands:

```typescript
interface AppContext {
  config: Config;
  database: Database;
  logger: Logger;
}

const context: AppContext = {
  config: loadConfig(),
  database: new Database(),
  logger: new Logger()
};

const cli = new Cli<AppContext>({
  ctx: context,
  name: 'my-app',
  version: '1.0.0'
});

// Access context in commands
export default new Command<AppContext>('users:list', {
  description: 'List users'
}).handler(async (ctx) => {
  const users = await ctx.database.getUsers();
  users.forEach(user => console.log(user.name));
});
```

---

## Documentation

📚 **[Getting Started](./docs/getting-started.md)** - Installation and first CLI  
🔨 **[Creating Commands](./docs/creating-commands.md)** - Schema-based and signature-based approaches  
⚙️ **[Arguments & Options](./docs/arguments-and-options.md)** - Type-safe parameters  
💬 **[Interactive Prompts](./docs/interactive-prompts.md)** - Build interactive CLIs  
🚀 **[Advanced Topics](./docs/advanced.md)** - Context, resolvers, error handling  
❓ **[Help System](./docs/help-system.md)** - Customize help output  
📖 **[API Reference](./docs/api-reference.md)** - Complete API documentation  
💡 **[Examples](./docs/examples.md)** - Real-world examples

---

## Examples

### Type-Safe Arguments

```typescript
export default new Command('deploy', {
  arguments: {
    environment: 'string',           // Required
    region: {                        // Optional with default
      type: 'string',
      default: 'us-east-1',
      required: false
    }
  }
}).handler((ctx, { arguments: args }) => {
  // args.environment is string
  // args.region is string | null
});
```

### Variadic Arguments

```typescript
export default new Command('delete', {
  arguments: {
    files: ['string']  // Array of strings
  }
}).handler((ctx, { arguments: args }) => {
  // args.files is string[]
  args.files.forEach(file => deleteFile(file));
});
```

### Options with Aliases

```typescript
export default new Command('serve', {
  options: {
    port: {
      type: 'number',
      alias: ['p'],
      default: 3000
    },
    verbose: {
      type: 'boolean',
      alias: ['v', 'V'],
      default: false
    }
  }
});

// Usage: serve --port=8080 -v
// Usage: serve -p 8080 --verbose
```

### Pre-Handlers for Validation

```typescript
export default new Command('deploy')
  .preHandler(async (ctx) => {
    if (!ctx.isAuthenticated) {
      console.error('Not authenticated');
      return 1;  // Stop execution
    }
  })
  .handler(async (ctx) => {
    // Only runs if authenticated
  });
```

### Command Groups

```typescript
// commands/db/migrate.ts
export default new Command('db:migrate', {
  description: 'Run migrations',
  group: 'Database'
});

// commands/db/seed.ts
export default new Command('db:seed', {
  description: 'Seed database',
  group: 'Database'
});

// Displayed as:
// Database:
//   db:migrate    Run migrations
//   db:seed       Seed database
```

---

## Why BOB Core?

BOB Core makes CLI development in TypeScript a breeze:

- **No Boilerplate** - Define commands declaratively, not imperatively
- **Type Safety** - Catch errors at compile time, not runtime
- **Great DX** - Intelligent auto-complete, clear error messages
- **User Friendly** - Beautiful help, smart suggestions, interactive prompts
- **Flexible** - Multiple command styles, extend anything
- **Well Tested** - Comprehensive test suite with Vitest

---

## Supported Types

| Type | Description | Example |
|------|-------------|---------|
| `'string'` | Text value | `'hello'` |
| `'number'` | Numeric value | `42` |
| `'boolean'` | True/false | `true` |
| `['string']` | String array | `['a', 'b']` |
| `['number']` | Number array | `[1, 2, 3]` |

**Note:** The `secret` flag is not a type but a property of OptionDefinition.

### Secret/Masked Input

For sensitive input like passwords, use the `secret: true` flag in the option definition:

```typescript
options: {
  password: {
    type: 'string',      // Type is still 'string'
    secret: true,        // Flag to mask input in interactive prompts
    required: true,
    description: 'User password'
  }
}
```

The `secret` flag masks the input when prompting interactively, making it perfect for passwords and API keys.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

[ISC](LICENSE) © Léo Hubert

---

<div align="center">

**[⬆ back to top](#bob-core)**

Made with ❤️ by developers, for developers

</div>
