<script context="module">
	const supportedLanguages = ['en', 'es'];
	export async function load({ session: { lang } }) {
		console.log(lang);
		if (supportedLanguages.includes(lang)) {
			return {
				status: 303,
				redirect: `/${lang}/invitation`
			};
		} else return {};
	}
</script>

<main>
	<article>
		<h1>Whoops! That language isn't yet supported. Try one of the below?</h1>
		<div class="mt-12">
			<a sveltekit:prefetch href="/en" class="my-2">English</a>
			<a sveltekit:prefetch href="/es" class="my-2">Español</a>
		</div>
	</article>
</main>
