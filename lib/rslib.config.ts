import { defineConfig } from '@rslib/core';
import { TypiaRspackPlugin } from 'typia-rspack-plugin';

export default defineConfig({
	lib: [
		{
			format: 'esm',
			syntax: 'es2022',
			dts: {
				bundle: false,
			},
		},
	],
	source: {
		entry: {
			index: './src/index.ts',
		},
	},
	output: {
		distPath: {
			root: './dist',
		},
		minify: {
			js: true,
		},
		sourceMap: {
			js: false,
		},
	},
	tools: {
		rspack: {
			plugins: [
				new TypiaRspackPlugin(),
			],
		},
	},
});
