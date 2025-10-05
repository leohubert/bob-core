# Interactive Prompts

BOB Core includes built-in support for interactive prompts using the `prompts` library through CommandIO.

## Accessing CommandIO

**In Modern Commands:**
```typescript
export default new Command('setup')
  .handler(async (ctx, { options }) => {
    // Access via this.io in Command class context
  });
```

**In Signature-Based Commands:**
```typescript
export default class SetupCommand extends CommandWithSignature {
  protected async handle() {
    // this.io is available
    const name = await this.io.askForInput('Your name:');
  }
}
```

You can also use helper methods in `CommandWithSignature`:
```typescript
const name = await this.askForInput('Your name:');
const confirmed = await this.askForConfirmation('Continue?');
```

## Text Input

### askForInput

Prompt for text, password, or numeric input.

```typescript
// Basic text input
const name = await this.io.askForInput('Enter your name:');

// With default value
const name = await this.io.askForInput('Enter your name:', 'Anonymous');

// Password (masked)
const password = await this.io.askForInput('Enter password:', undefined, {
  type: 'password'
});

// Number input
const age = await this.io.askForInput('Enter your age:', undefined, {
  type: 'number',
  min: 0,
  max: 120
});

// With validation
const email = await this.io.askForInput('Enter email:', undefined, {
  validate: (value: string) => {
    if (!value.includes('@')) {
      return 'Please enter a valid email';
    }
    return true;
  }
});
```

**Options:**
- `type`: `'text'` | `'password'` | `'number'`
- `validate`: Function returning `true` or error message string
- `min`: Minimum value (for numbers)
- `max`: Maximum value (for numbers)

## Confirmation

### askForConfirmation

Ask yes/no questions.

```typescript
// Basic confirmation
const shouldContinue = await this.io.askForConfirmation('Continue?');

// With default value
const shouldDelete = await this.io.askForConfirmation(
  'Delete all files?',
  false  // Default to No
);

if (shouldDelete) {
  // User confirmed
}
```

## Selection

### askForSelect

Let users choose from a list.

```typescript
// Simple string array
const env = await this.io.askForSelect(
  'Select environment:',
  ['development', 'staging', 'production']
);

// With rich options
const framework = await this.io.askForSelect(
  'Choose a framework:',
  [
    { title: 'React', value: 'react', description: 'A JavaScript library for UIs' },
    { title: 'Vue', value: 'vue', description: 'The Progressive Framework' },
    { title: 'Angular', value: 'angular', description: 'Platform for building apps' }
  ]
);

// Multi-select
const features = await this.io.askForSelect(
  'Select features:',
  ['authentication', 'database', 'caching', 'logging'],
  { type: 'multiselect' }
);

// With autocomplete
const country = await this.io.askForSelect(
  'Choose country:',
  countries,  // Large array
  {
    type: 'autocomplete',
    suggest: async (input, choices) => {
      return choices.filter(c =>
        c.title.toLowerCase().includes(input.toLowerCase())
      );
    }
  }
);
```

**Types:**
- `'select'` - Single selection (default)
- `'multiselect'` - Multiple selections
- `'autocomplete'` - Searchable single selection
- `'autocompleteMultiselect'` - Searchable multiple selections

**Select Options:**
```typescript
{
  title: string;           // Display text
  value?: any;            // Return value (defaults to title)
  description?: string;   // Optional description
  disabled?: boolean;     // Disable this option
  selected?: boolean;     // Pre-selected (for multiselect)
}
```

## List Input

### askForList

Prompt for comma-separated values.

```typescript
// Basic list
const tags = await this.io.askForList('Enter tags (comma-separated):');
// User enters: "urgent, bug, frontend"
// Result: ['urgent', 'bug', 'frontend']

// With custom separator
const items = await this.io.askForList('Enter items:', undefined, {
  separator: ';'
});

// With validation
const emails = await this.io.askForList('Enter email addresses:', undefined, {
  validate: (values: string[]) => {
    if (values.length === 0) {
      return 'Please enter at least one email';
    }
    return true;
  }
});

// With formatting
const names = await this.io.askForList('Enter names:', undefined, {
  format: (value: string) => value.trim().toLowerCase()
});
```

## Toggle

### askForToggle

Binary choice with custom labels.

```typescript
const preference = await this.io.askForToggle(
  'Enable dark mode?',
  true,  // Default value
  {
    active: 'Yes',
    inactive: 'No'
  }
);
```

## Date Input

### askForDate

Prompt for date selection.

```typescript
const birthdate = await this.io.askForDate('Enter your birthdate:');

// With default
const deadline = await this.io.askForDate(
  'Project deadline:',
  new Date()  // Default to today
);

// With validation
const futureDate = await this.io.askForDate('Select future date:', undefined, {
  validate: (date: Date) => {
    if (date < new Date()) {
      return 'Date must be in the future';
    }
    return true;
  }
});

// With custom mask
const scheduledDate = await this.io.askForDate('Schedule for:', undefined, {
  mask: 'YYYY-MM-DD'
});
```

## Loaders/Spinners

### newLoader

Display animated loading indicators.

```typescript
// Basic loader
const loader = this.io.newLoader('Processing...');
// ... do async work
loader.stop();

// Update text dynamically
const loader = this.io.newLoader('Starting...');
await step1();
loader.updateText('Step 2...');
await step2();
loader.updateText('Finalizing...');
await step3();
loader.stop();

// Using with disposal (recommended)
{
  using loader = this.io.newLoader('Downloading...');
  await download();
  // Automatically stopped when scope exits
}

// Custom spinner
const loader = this.io.newLoader(
  'Loading',
  ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],  // Spinner chars
  80  // Delay in ms
);
```

## Logging

CommandIO also provides logging methods:

```typescript
this.io.log('Regular message');
this.io.info('Info message');
this.io.warn('Warning message');
this.io.error('Error message');
this.io.debug('Debug message');
```

## Complete Interactive Example

```typescript
import { Command } from 'bob-core';

export default new Command('init', {
  description: 'Initialize a new project'
}).handler(async (ctx, { options }) => {
  // Get basic info
  const name = await this.io.askForInput('Project name:');
  const description = await this.io.askForInput('Description:', '');

  // Select framework
  const framework = await this.io.askForSelect('Choose framework:', [
    { title: 'React', value: 'react' },
    { title: 'Vue', value: 'vue' },
    { title: 'Angular', value: 'angular' }
  ]);

  // Multi-select features
  const features = await this.io.askForSelect(
    'Select features:',
    ['TypeScript', 'ESLint', 'Prettier', 'Testing', 'CI/CD'],
    { type: 'multiselect' }
  );

  // Confirmation
  const shouldInstall = await this.io.askForConfirmation(
    'Install dependencies now?',
    true
  );

  // Show progress
  using loader = this.io.newLoader('Creating project...');

  // Create project files
  await createProject({ name, description, framework, features });

  loader.updateText('Installing dependencies...');

  if (shouldInstall) {
    await installDependencies();
  }

  loader.stop();

  this.io.info(`✅ Project ${name} created successfully!`);
});
```

## Handling User Cancellation

When users press Ctrl+C or cancel a prompt, it returns `null`:

```typescript
const name = await this.io.askForInput('Your name:');

if (!name) {
  this.io.error('Operation cancelled');
  return 1; // Exit with error code
}

// Continue with name
```

## Best Practices

1. **Provide defaults** for non-critical inputs
2. **Validate early** to give immediate feedback
3. **Group related prompts** for better UX
4. **Show progress** for long operations
5. **Handle cancellation** gracefully
6. **Use descriptions** in selects for clarity
7. **Pre-select sensible options** in multiselect

## Next Steps

- [Advanced Topics](./advanced.md) - Context, error handling, and more
- [Examples](./examples.md) - Complete working examples
- [API Reference](./api-reference.md) - Full API documentation
