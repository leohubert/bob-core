import {defineConfig} from 'vite'
import {resolve} from 'path'
import dts from 'vite-plugin-dts'
import {writeFileSync, mkdirSync} from 'fs'

export default defineConfig({
	plugins: [
		dts({
			include: ['src/**/*'],
			exclude: ['src/**/*.test.ts'],
			outDir: 'dist/cjs',
		}),
		dts({
			include: ['src/**/*'],
			exclude: ['src/**/*.test.ts'],
			outDir: 'dist/esm',
		}),
		{
			name: 'create-package-json',
			writeBundle() {
				mkdirSync('dist/cjs', { recursive: true })
				writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }, null, 2))
			}
		}
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'BobCore',
		},
		rollupOptions: {
			external: ['chalk', 'minimist', 'prompts', 'string-similarity', 'node:fs', 'path', 'fs'],
			output: [
				{
					format: 'es',
					dir: 'dist/esm',
					entryFileNames: 'src/index.js',
				},
				{
					format: 'cjs',
					dir: 'dist/cjs',
					entryFileNames: 'src/index.js',
				}
			]
		}
	},
	resolve: {
		alias: {
			'@/src': resolve(__dirname, './src')
		}
	}
})