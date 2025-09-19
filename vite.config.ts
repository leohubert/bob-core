import {defineConfig} from 'vite'
import {resolve} from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [
		dts({
			include: ['src/**/*'],
			exclude: ['src/**/*.test.ts'],
			outDir: 'dist/types'
		})
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'BobCore',
			formats: ['es', 'cjs'],
			fileName: (format) => `bob-core.${format === 'es' ? 'js' : 'cjs'}`
		},
		outDir: 'dist',
		rollupOptions: {
			external: ['chalk', 'minimist', 'prompts', 'string-similarity', 'node:fs', 'path', 'fs'],
			output: {
				globals: {
					'chalk': 'chalk',
					'minimist': 'minimist',
					'prompts': 'prompts',
					'string-similarity': 'stringSimilarity',
					'node:fs': 'fs',
					'path': 'path',
					'fs': 'fs'
				}
			}
		}
	},
	resolve: {
		alias: {
			'@/src': resolve(__dirname, './src')
		}
	}
})