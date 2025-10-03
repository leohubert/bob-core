import {Command} from "@/src/Command.js";

export default new Command('new-test')
	.arguments({
		name: {
			type: 'string',
			required: true,
			description: 'Name argument'
		},
		age: {
			type: 'number',
			required: true,
			description: 'Age argument'
		},
		tests: {
			type: 'secret',
			required: true,
			description: 'Age argument'
		},
		tags: {
			type: ['number'],
			required: true,
			variadic: true,
			description: 'Tags (variadic)'
		}
	})
	.options({
		test: 'string',
		force: {
			alias: ['f'],
			type: 'boolean',
			description: 'Force the action',
			required: false,
		}
	})
	.handler((ctx, opts) => {
		const test = opts.options.force
		// Note: Functional handlers don't have access to this.io
		// For logging in handlers, you can either:
		// 1. Pass io/logger through the context
		// 2. Use console.log directly (not recommended for library code)
		console.log('test command', { options: opts.options, arguments: opts.arguments });
	})