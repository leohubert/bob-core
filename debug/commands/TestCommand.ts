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
			required: false,
			description: 'Age argument'
		},
		tags: {
			type: ['string'],
			required: false,
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
	.handle((ctx, opts) => {
		const test = opts.options.force
		console.log('test command', { options: opts.options, arguments: opts.arguments });
	})