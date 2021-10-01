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
	import delay from 'lodash.delay';
	import { setContext, onMount } from 'svelte';
	import { writable } from 'svelte/store';

	import Typewriter from 'svelte-typewriter';
	import Progress from '$lib/Progress.svelte';
	import SekritTheater from '$lib/SekritTheater.svelte';
	import Airbnb from '$lib/Airbnb.svelte';
	import Confetti from '$lib/Confetti.svelte';
	import End from '$lib/End.svelte';

	import { supportedLanguages, t } from '$stores';

	export let cards, otherLangs, title, lang;

	$: promise = null;

	// write reactive context to pass props down deep
	let step = writable(0);
	setContext('step', step);

	const specials = new Map([
		['confetti', Confetti],
		['sekrit-theater', SekritTheater],
		['airbnb', Airbnb],
		['end', End]
	]);

	const config = {
		delay: 600,
		length: cards.length - 1,
		cards
	};
	setContext('stuff', config);

	const timer = () => {
		new Promise((res) => {
			setTimeout(async () => {
				$step = $step + 1;
				res();
			}, 1000);
		});
	};

	const advanceCard = () => {
		clearTimeout($t);
		if ($step < config.length) timer();
	};

	const mount = () => (mounted = true);
	onMount(mount);

	const reset = () => {
		clearTimeout($t);
		$step = 0;
		activeCard = cards[0];
		console.log('reset', $t);
	};

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
				href="/{otherLang}/invitation"
				class="z-50 absolute top-3 left-2 leading-none text-xl font-mono align-middle transition p-0 m-0 bg-transparent border-none hover:bg-transparent hover:scale-125"
			>
				👈{@html $supportedLanguages[otherLang].flag}</a
			>
		{/each}

		{#if activeCard.text && $step < config.length}
			{#await promise then resolve}
				<article class="p-6 mb-8">
					<Typewriter
						interval={85}
						cascade
						cursor={false}
						delay={$step ? config.delay : 0}
						on:done={advanceCard}
					>
						{#each activeCard.text as line}
							<h1>{@html line}</h1>
						{/each}
					</Typewriter>
				</article>
			{/await}
		{/if}
	</main>
{/if}
