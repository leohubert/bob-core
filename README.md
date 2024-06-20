# BOB Core - Bash Operation Buddy Core

## Introduction

BOB (Bash Operation Buddy) Core is a library that provides a set of functions to create your own CLI in TypeScript.

## Usage

```bash
npm install bob-core
```

Initialize the CLI:

```typescript
import { CLI } from 'bob-core';

const cli = new CLI();

await cli.loadCommandsPath('./commands');

cli.run('commandName', 'arg1', 'arg2', 'arg3');
```

Create a command in the `commands` folder:

```typescript
import { Command } from 'bob-core';

export default class MyCommand extends Command {
  public name = 'my-command {arg1} {--option1}';
  public description = 'This is my command';

  public async handle() {
    console.log('Hello World');
    console.log('Arguments:', this.argument('arg1'));
    console.log('Options:', this.option('option1'));
  }
}
```

## Commands signature

The command signature is a string that defines the command name, arguments and options.

Example:    
```typescript
    signature = 'my-command {arg1} {arg2} {arg3} {--option1} {--option2}';
```

### Arguments

All user supplied arguments and options are wrapped in curly braces. 
In the following example, the command defines three **required** arguments `arg1`, `arg2` and `arg3`.

```typescript
    signature = 'my-command {arg1} {arg2} {arg3}';
```

You may want to make an argument optional by adding a `?` after the argument name or by providing a default value with `=`.

```typescript
    signature = 'my-command {arg1} {arg2?} {arg3=defaultValue}';

    handle() {
        this.argument('arg1'); // 'value' or throw an error if not provided
        this.argument('arg2'); // 'value' or null if not provided
        this.argument('arg3'); // 'value' or 'defaultValue' if not provided
    }
```

You can also define a variadic argument by adding `*` after the argument name.
Variadic arguments are stored in an array.

```typescript
    signature = 'my-command {arg1} {arg2*}';

    handle() {
        this.argument('arg1'); // 'value1'
        this.argument('arg2'); // ['value2', 'value3']
    }
```

Variadic arguments can also be optional.

```typescript
    signature = 'my-command {arg1} {arg2*?}';
```

### Options

Options are defined by `{--optionName}`.

```typescript
    signature = 'my-command {--option1} {--option2} {--option3}';
```

By default options are boolean with a default value of `false`.
You can also change the option type to string by adding `=` to the option definition.
You can also provide a default value by adding `=value`.

If the value is 'true' or 'false', the option will be converted to a boolean.

```typescript
    signature = 'my-command {--option1} {--option2=true} {--option3=} {--option4=defaultValue} {--option5=}';

    handle() {
        this.option('option1'); // by default `false` and can be set to `true` by the user 
        this.option('option2'); // by default `true` and can be set to `false` by the user
        this.option('option3'); // by default `null` and can be set to "value" by the user
        this.option('option4'); // by default "defaultValue" and can be set to "value" by the user
    }
```

You can also define a variadic option by adding `*` as option value. (e.g. `{--option2=*}`)
Variadic options are stored in an array.

```typescript
    signature = 'my-command {--option1} {--option2=*}';

    handle() {
        this.option('option1'); // 'value1' 
        this.option('option2'); // ['value2', 'value3'] // or [] if not provided
    }
```

## Commands I/O

### Arguments

```typescript
    this.argument('arg1');
```

You can also provide a default value if the argument is optional.

```typescript
    this.argument('arg1', 'defaultValue');
```

If you always need a boolean value, you can use the `argumentBoolean` method.

```typescript
    this.argumentBoolean('arg1');
```

If you always need a number value, you can use the `argumentNumber` method.

```typescript
    this.argumentNumber('arg1');
```

If you always need a array value, you can use the `argumentArray` method.

```typescript
    this.argumentArray('arg1');
```

### Options

```typescript
    this.option('option1');
```

You can also provide a default value if the option is optional.

```typescript
    this.option('option1', 'defaultValue');
```

If you always need a boolean value, you can use the `optionBoolean` method.

```typescript
    this.optionBoolean('option1');
```

If you always need a number value, you can use the `optionNumber` method.

```typescript
    this.optionNumber('option1');
```

If you always need a array value, you can use the `optionArray` method.

```typescript
    this.optionArray('option1'); 
```
