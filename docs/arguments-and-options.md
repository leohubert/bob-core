# Arguments & Options

Learn how to define, validate, and use command arguments and options in BOB Core.

## Supported Types

BOB Core supports the following parameter types:

| Type | Description | Example Value |
|------|-------------|--------------|
| `'string'` | Text value | `'hello'` |
| `'number'` | Numeric value | `42` |
| `'boolean'` | True/false | `true` |
| `['string']` | Array of strings | `['a', 'b']` |
| `['number']` | Array of numbers | `[1, 2, 3]` |

**Note:** For masked/password input, use `{ type: 'string', secret: true }`. The `secret` flag is a property of OptionDefinition, not a type itself.

## Arguments

Arguments are positional parameters passed to commands.

### Modern Schema-Based

```typescript
import { Command } from 'bob-core';

export default new Command('copy', {
  arguments: {
    source: 'string',              // Required string
    destination: 'string',         // Required string
    count: {                       // Optional number with default
      type: 'number',
      default: 1,
      required: false
    }
  }
}).handler((ctx, { arguments: args }) => {
  console.log(`Copying ${args.source} to ${args.destination}`);
  console.log(`Count: ${args.count}`);
});
```

### Signature-Based

```typescript
export default class CopyCommand extends CommandWithSignature {
  signature = 'copy {source} {destination} {count=1}';

  protected async handle() {
    const source = this.argument<string>('source');
    const destination = this.argument<string>('destination');
    const count = this.argument<number>('count');
  }
}
```

### Required vs Optional Arguments

**Modern:**
```typescript
arguments: {
  required: 'string',              // Required
  optional: {                      // Optional
    type: 'string',
    required: false,
    default: null
  }
}
```

**Signature-Based:**
```typescript
signature = 'command {required} {optional?}'
```

### Variadic Arguments

Variadic arguments accept multiple values as an array.

**Modern:**
```typescript
arguments: {
  files: ['string']  // Array of strings
}

// Usage: command file1.txt file2.txt file3.txt
// args.files = ['file1.txt', 'file2.txt', 'file3.txt']
```

**Signature-Based:**
```typescript
signature = 'delete {files*}'

protected async handle() {
  const files = this.argument<string[]>('files');
  // files = ['file1.txt', 'file2.txt', ...]
}
```

### Default Values

**Modern:**
```typescript
arguments: {
  port: {
    type: 'number',
    default: 3000
  }
}
```

**Signature-Based:**
```typescript
signature = 'serve {port=3000}'
```

## Options

Options are named flags prefixed with `--`.

### Boolean Options

**Modern:**
```typescript
options: {
  force: {
    type: 'boolean',
    default: false,
    description: 'Force the operation'
  }
}

// Usage: command --force
```

**Signature-Based:**
```typescript
signature = 'command {--force}'

// Usage: command --force
```

### String Options

**Modern:**
```typescript
options: {
  output: {
    type: 'string',
    default: null,
    description: 'Output file path'
  }
}

// Usage: command --output=result.txt
```

**Signature-Based:**
```typescript
signature = 'command {--output=}'

// Usage: command --output=result.txt
```

### Number Options

**Modern:**
```typescript
options: {
  timeout: {
    type: 'number',
    default: 30,
    description: 'Timeout in seconds'
  }
}

// Usage: command --timeout=60
```

**Signature-Based:**
```typescript
// Type conversion happens automatically
signature = 'command {--timeout=30}'
const timeout = this.option<number>('timeout');
```

### Array Options

**Modern:**
```typescript
options: {
  tags: {
    type: ['string'],
    default: [],
    description: 'Tags to apply'
  }
}

// Usage: command --tags=tag1 --tags=tag2
// options.tags = ['tag1', 'tag2']
```

**Signature-Based:**
```typescript
signature = 'command {--tags=*}'

// Usage: command --tags=tag1 --tags=tag2
const tags = this.option<string[]>('tags');
```

### Secret/Password Options

For sensitive input that should be masked:

**Modern:**
```typescript
options: {
  password: {
    type: 'string',
    secret: true,  // Masks input in interactive prompts
    required: true,
    description: 'User password'
  }
}
```

## Aliases

Define shorthand aliases for options.

**Modern:**
```typescript
options: {
  verbose: {
    type: 'boolean',
    alias: ['v', 'V'],
    default: false
  }
}

// Usage: command --verbose OR command -v OR command -V
```

**Signature-Based:**
```typescript
signature = 'command {--verbose|v|V}'

// Usage: command --verbose OR command -v OR command -V
```

## Descriptions

Add descriptions to appear in help text.

**Modern:**
```typescript
arguments: {
  filename: {
    type: 'string',
    description: 'The file to process'
  }
},
options: {
  force: {
    type: 'boolean',
    default: false,
    description: 'Skip confirmation prompts'
  }
}
```

**Signature-Based:**
```typescript
helperDefinitions = {
  filename: 'The file to process',
  '--force': 'Skip confirmation prompts'
};
```

## Validation

### Automatic Validation

BOB Core automatically validates:
- Required arguments/options are present
- Type conversion (string to number, etc.)
- Invalid option names

### Manual Validation

**Modern with Pre-Handler:**
```typescript
export default new Command('upload')
  .arguments({ file: 'string' })
  .preHandler((ctx, { arguments: args }) => {
    if (!args.file.endsWith('.pdf')) {
      console.error('File must be a PDF');
      return 1; // Stop execution
    }
  })
  .handler((ctx, { arguments: args }) => {
    // File is validated
  });
```

### Interactive Prompts for Missing Required Values

If a required argument is missing, BOB Core can prompt for it:

```typescript
// User runs: command (without arguments)
// BOB prompts: "name is required: "
// User enters: "John"
// Command executes with name = "John"
```

Disable prompting:

```typescript
const cli = new Cli();
const command = new Command('test')
  .disablePrompting();
```

## Type Conversion

BOB Core automatically converts values to the correct type:

```typescript
// String to number
arguments: { count: 'number' }
// Input: "42" -> Parsed: 42

// String to boolean
options: { force: { type: 'boolean' } }
// Input: "true" -> Parsed: true
// Input: "false" -> Parsed: false

// Comma-separated to array
options: { items: ['string'] }
// Input: "a,b,c" -> Parsed: ['a', 'b', 'c']
```

## Complete Example

```typescript
import { Command } from 'bob-core';

export default new Command('process', {
  description: 'Process files with various options',
  arguments: {
    input: {
      type: 'string',
      description: 'Input file path'
    },
    output: {
      type: 'string',
      required: false,
      default: null,
      description: 'Output file path (optional)'
    }
  },
  options: {
    verbose: {
      type: 'boolean',
      alias: ['v'],
      default: false,
      description: 'Enable verbose logging'
    },
    format: {
      type: 'string',
      default: 'json',
      description: 'Output format'
    },
    tags: {
      type: ['string'],
      default: [],
      description: 'Tags to apply'
    },
    timeout: {
      type: 'number',
      default: 30,
      description: 'Timeout in seconds'
    }
  }
}).handler((ctx, { arguments: args, options }) => {
  console.log('Input:', args.input);
  console.log('Output:', args.output || 'stdout');
  console.log('Format:', options.format);
  console.log('Verbose:', options.verbose);
  console.log('Tags:', options.tags);
  console.log('Timeout:', options.timeout);
});
```

Usage examples:
```bash
# Minimal
node cli.js process input.txt

# With options
node cli.js process input.txt output.txt --verbose --format=xml

# With aliases and arrays
node cli.js process data.csv -v --tags=urgent --tags=priority

# With timeout
node cli.js process large.dat --timeout=120
```

## Next Steps

- [Interactive Prompts](./interactive-prompts.md) - Build interactive commands
- [Help System](./help-system.md) - Customize help output
- [API Reference](./api-reference.md) - Complete API documentation
