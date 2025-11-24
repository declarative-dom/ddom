import { defineConfig } from '@rslib/core';
import { TypiaRspackPlugin } from 'typia-rspack-plugin';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

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
				// Rsdoctor is a build analyzer - enable with RSDOCTOR=true npm run build
				process.env.RSDOCTOR === 'true' &&
					new RsdoctorRspackPlugin({
						// Rsdoctor options
						linter: {
							rules: {
								'ecma-version-check': 'off',
							},
						},
					}),
			].filter(Boolean),
		},
	},
});
