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
				// Rsdoctor is a build analyzer - enable with RSDOCTOR=true or npm run build:analyze
				// Only instantiate the plugin when RSDOCTOR env variable is set to avoid overhead
				...(process.env.RSDOCTOR === 'true'
					? [
							new RsdoctorRspackPlugin({
								// Rsdoctor options
								linter: {
									rules: {
										// Disable ecma-version-check since we explicitly set target in lib config
										'ecma-version-check': 'off',
									},
								},
							}),
						]
					: []),
			],
		},
	},
});
