<script context="module">
	export async function load({ page, fetch }) {
		const { lang } = page.params;
		const url = `/${lang}/invitation.json`;
		const res = await fetch(url);
		if (res.ok) {
			const {
				page: { cards, title },
				otherLangs
			} = await res.json();
			return {
				props: { lang, cards, title, otherLangs }
			};
		}
	}
</script>

<script>
	import { setContext, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Typewriter from 'svelte-typewriter';
	import Progress from '$lib/Progress.svelte';
	import SekritTheater from '$lib/SekritTheater.svelte';
	import Airbnb from '$lib/Airbnb.svelte';
	import Confetti from '$lib/Confetti.svelte';
	import End from '$lib/End.svelte';
	import { supportedLanguages } from '$stores';

	export let cards, otherLangs, title, lang;

	// write reactive context to pass props down deep
	let step = writable(0);

	const specials = new Map([
		['confetti', Confetti],
		['sekrit-theater', SekritTheater],
		['airbnb', Airbnb],
		['end', End]
	]);

	const config = {
		delay: 600,
		timeout: 1000,
		length: cards.length - 1,
		cards
	};

	const advance = () => setTimeout(() => $step++, config.timeout);
	const mount = () => (mounted = true);
	const reset = () => {
		$step = 0;
		activeCard = cards[0];
	};

	setContext('step', step);
	setContext('stuff', config);
	onMount(mount);

	$: activeCard = cards[$step];
	$: mounted = false;
	$: lang, reset();
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:url" content="https://married.sawyer.codes/{lang}/invitation" />
</svelte:head>

{#if mounted}
	<main class="flex items-center justify-center h-full w-full min-h-screen text-center">
		{#if activeCard.special}
			{#each activeCard.special as special}
				<svelte:component this={specials.get(special)} />
			{/each}
		{/if}

		<Progress />

		{#each otherLangs as otherLang}
			<a
				sveltekit:prefetch
				rel="external"
				href="/{otherLang}/invitation"
				class="z-50 absolute top-3 left-2 leading-none text-xl font-mono align-middle transition p-0 m-0 bg-transparent border-none hover:bg-transparent hover:scale-125"
			>
				👈{@html $supportedLanguages[otherLang].flag}
			</a>
		{/each}

		{#if activeCard.text && $step < config.length}
			<article class="p-6 mb-8">
				<Typewriter
					interval={85}
					cascade
					cursor={false}
					delay={$step ? config.delay : 0}
					on:done={advance}
				>
					{#each activeCard.text as line (line)}
						<h1>{@html line}</h1>
					{/each}
				</Typewriter>
			</article>
		{/if}
	</main>
{/if}
