# Getting Started

Welcome to BOB Core! This guide will help you create your first CLI application in minutes.

## Installation

Install BOB Core using npm:

```bash
npm install bob-core
```

Or using yarn:

```bash
yarn add bob-core
```

## Your First CLI

Let's create a simple CLI application. Create a file named `cli.ts`:

```typescript
import { Cli } from 'bob-core';

// Initialize the CLI
const cli = new Cli({
  name: 'my-cli',
  version: '1.0.0'
});

// Load commands from a directory
await cli.withCommands('./commands');

// Run a command
const exitCode = await cli.runCommand(
  process.argv[2],
  ...process.argv.slice(3)
);

process.exit(exitCode);
```

## Creating Your First Command

Create a `commands` directory and add a file `greet.ts`:

### Modern Schema-Based Approach (Recommended)

```typescript
import { Command } from 'bob-core';

export default new Command('greet', {
  description: 'Greet a user',
  arguments: {
    name: 'string'
  },
  options: {
    greeting: {
      type: 'string',
      default: 'Hello',
      description: 'The greeting to use'
    }
  }
}).handler((ctx, { arguments: args, options }) => {
  console.log(`${options.greeting}, ${args.name}!`);
});
```

### Signature-Based Approach

```typescript
import { CommandWithSignature } from 'bob-core';

export default class GreetCommand extends CommandWithSignature {
  signature = 'greet {name} {--greeting=Hello}';
  description = 'Greet a user';

  protected async handle() {
    const name = this.argument('name');
    const greeting = this.option('greeting');
    console.log(`${greeting}, ${name}!`);
  }
}
```

## Running Your CLI

Compile your TypeScript and run:

```bash
node cli.js greet John
# Output: Hello, John!

node cli.js greet Jane --greeting=Hi
# Output: Hi, Jane!
```

## Built-in Help

BOB Core automatically generates help documentation:

```bash
node cli.js help
# Shows all available commands

node cli.js greet --help
# Shows help for the greet command
```

## Project Structure

A typical BOB Core project structure:

```
my-cli/
├── commands/
│   ├── greet.ts
│   └── ...
├── cli.ts
├── package.json
└── tsconfig.json
```

## Next Steps

- [Creating Commands](./creating-commands.md) - Learn about both command definition styles
- [Arguments & Options](./arguments-and-options.md) - Deep dive into command parameters
- [Interactive Prompts](./interactive-prompts.md) - Build interactive CLIs
- [Advanced Topics](./advanced.md) - Context, custom resolvers, and more

## TypeScript Configuration

For best results, use these TypeScript settings:

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

## Using with Different Build Tools

### With tsx (Development)

```bash
npx tsx cli.ts greet John
```

### With ts-node

```bash
ts-node cli.ts greet John
```

### Production Build

```bash
tsc
node dist/cli.js greet John
```
