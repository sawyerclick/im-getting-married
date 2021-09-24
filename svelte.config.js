/** @type {import('@sveltejs/kit').Config} */
import path from "path";
import autoprefixer from "autoprefixer";
import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-netlify';

const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: adapter(),
		vite: {
			resolve: {
				alias: {
					'$data': path.resolve("./src/data"),
					"$stores": path.resolve('./src/stores.js'),
					'$utils': path.resolve('./src/utils'),
					'$api': path.resolve('./src/routes/api')
				}
			}
		}
	},

	preprocess: [
		preprocess({
			postcss: true
		})
	]
};

export default config;
