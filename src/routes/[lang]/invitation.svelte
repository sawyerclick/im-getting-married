<script context="module">
	export async function load({ page, fetch }) {
		const { lang } = page.params;
		const url = `/api/invitation/${lang}.json`;
		const res = await fetch(url);
		if (res.ok) {
			const {
				invitation: { cards, title },
				otherLangs
			} = await res.json();
			return {
				props: { lang, cards, title, otherLangs }
			};
		}
	}
</script>

<script>
	import { setContext, onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import Typewriter from 'svelte-typewriter';
	import Progress from '$lib/Progress.svelte';
	import SekritTheater from '$lib/SekritTheater.svelte';
	import Airbnb from '$lib/Airbnb.svelte';
	import Confetti from '$lib/Confetti.svelte';
	import End from '$lib/End.svelte';
	export let cards, title, lang, otherLangs;

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

	const advanceCard = () => {
		if ($step < config.length) {
			timer = setTimeout(() => {
				$step = $step + 1;
				clearTimeout(timer);
			}, 1000);
		}
	};

	const mount = () => (mounted = true);
	onMount(mount);

	$: timer = null;
	$: activeCard = cards[$step];
	$: mounted = false;

	// reset vars on lang change
	const reset = () => {
		$step = 0;
		activeCard = cards[0];
		clearTimeout(timer);
	};
	$: lang, reset();
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:url" content="https://married.sawyer.codes/invitation/{lang}" />
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
				class="z-50 absolute top-3 left-2 leading-none text-lg font-mono transition p-0 m-0 bg-transparent border-none hover:text-purple-700 hover:underline hover:bg-transparent"
			>
				{otherLang}</a
			>
		{/each}

		{#if activeCard.text}
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
		{/if}
	</main>
{/if}
