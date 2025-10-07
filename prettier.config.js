/** @type {import("prettier").Config} */
export default {
	quoteProps: 'consistent',
	arrowParens: 'avoid',
	bracketSpacing: true,
	importOrder: ['^[^.@]/', '^@/', '^[.]'],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	plugins: ['@trivago/prettier-plugin-sort-imports'],
	printWidth: 160,
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	useTabs: true,
};
