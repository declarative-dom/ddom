import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/index.ts',
	output: {
		dir: 'dist',
		format: 'esm',
		sourcemap: false,
	},
	plugins: [
		resolve(),
		typescript(),
		// terser({
		// 	compress: {
		// 		drop_console: false,
		// 		drop_debugger: true,
		// 		pure_funcs: ['console.debug', 'console.info'],
		// 	},
		// 	mangle: true,
		// 	format: {
		// 		comments: false
		// 	}
		// })
	]
};
