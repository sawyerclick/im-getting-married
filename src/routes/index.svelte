<script>
	import { setContext, onMount } from 'svelte';
	import '../app.postcss';
	import '../font.css';
	import Typewriter from 'svelte-typewriter';
	import Progress from '$lib/Progress.svelte';
	import Restart from '$lib/Restart.svelte';
	import SekritTheater from '$lib/SekritTheater.svelte';
	import Airbnb from '$lib/Airbnb.svelte';
	import Confetti from '$lib/Confetti.svelte';
	import Summary from '$lib/Summary.svelte';
	import cards from '../cards.json';
	import { step } from '../stores';

	const specials = new Map([
		['confetti', Confetti],
		['sekrit-theater', SekritTheater],
		['airbnb', Airbnb],
		['summary', Summary]
	]);

	$: timeout = null;
	const advanceCard = () => {
		clearTimeout(timeout);
		if ($step < length) timeout = setTimeout(() => step.set($step + 1), 1000);
	};

	const length = cards.length - 1;
	setContext('stuff', {
		length,
		cards
	});

	$: activeCard = cards[$step];
	$: mounted = false;
	onMount(() => {
		mounted = true;
	});
</script>

{#if mounted}
	<main
		class="flex items-center justify-center h-full w-full min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 text-center"
	>
		{#if activeCard.special}
			{#each activeCard.special as special}
				<svelte:component this={specials.get(special)} />
			{/each}
		{/if}

		<Progress />

		<div class="fixed top-4 left-2 w-4 h-4">
			<Restart />
		</div>

		{#if activeCard.text}
			<article class="p-4">
				<Typewriter
					interval={85}
					cascade
					cursor={false}
					delay={$step > 0 ? 400 : 0}
					on:done={advanceCard}
				>
					{#each activeCard.text as line}
						<h1>{@html line}</h1>
					{/each}
				</Typewriter>
			</article>
		{/if}

		<button
			class="ctrl left-2"
			on:click={() => {
				step.set($step - 1);
				clearTimeout(timeout);
			}}
			hidden={!$step}
		>
			previous
		</button>

		<button
			class="ctrl right-2"
			on:click={() => {
				step.set($step + 1);
				clearTimeout(timeout);
			}}
			hidden={$step == cards.length - 1}
		>
			next
		</button>
	</main>
{/if}
