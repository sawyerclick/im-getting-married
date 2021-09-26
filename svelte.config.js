/** @type {import('@sveltejs/kit').Config} */
import path from "path";
import autoprefixer from "autoprefixer";
import sveltePreprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-netlify';

const preprocess = sveltePreprocess({
	postcss: {
		plugins: [autoprefixer]
	}
})

const config = {
	preprocess,
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: adapter(),
		vite: {
			resolve: {
				alias: {
					'$locales': path.resolve("./src/locales"),
					"$stores": path.resolve('./src/stores.js'),
					'$utils': path.resolve('./src/utils'),
					'$api': path.resolve('./src/routes/api')
				}
			}
		}
	},
};

export default config;
