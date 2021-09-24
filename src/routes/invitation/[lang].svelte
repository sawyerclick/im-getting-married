<script context="module">
	export async function load({ page, fetch }) {
		const { lang } = page.params;
		const url = `/api/invitation/${lang}.json`;
		const res = await fetch(url);
		if (res.ok) {
			const { match, otherLang } = await res.json();
			return {
				props: { lang, match, otherLang }
			};
		}
	}
</script>

<script>
	import Invitation from '$lib/__invitation.svelte';
	export let match, lang, otherLang;
</script>

<svelte:head>
	<title>{match.title}</title>
	<meta property="og:url" content="https://married.sawyer.codes/invitation/{lang}" />
</svelte:head>

<Invitation cards={match.body} {otherLang} />
