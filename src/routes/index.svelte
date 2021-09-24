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
	import End from '$lib/End.svelte';
	import cards from '../cards.json';
	import { step } from '../stores';

	const specials = new Map([
		['confetti', Confetti],
		['sekrit-theater', SekritTheater],
		['airbnb', Airbnb],
		['end', End]
	]);

	const config = {
		delay: 600,
		timer: null,
		length: cards.length - 1,
		cards
	};

	setContext('stuff', config);

	const advance = () => {
		if ($step < config.length) clearTimeout(config.timer);
		config.timer = setTimeout(() => {
			step.set($step + 1);
		}, 1000);
	};

	const restart = () => {
		clearTimeout(config.timer);
		step.set(0);
	};

	onMount(() => {
		mounted = true;
	});

	$: activeCard = cards[$step];
	$: mounted = false;
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
			<Restart on:click={restart} />
		</div>

		{#if activeCard.text}
			<article class="p-4 ">
				<Typewriter
					interval={85}
					cascade
					cursor={false}
					delay={$step ? config.delay : 0}
					on:done={advance}
				>
					{#each activeCard.text as line}
						<h1>{@html line}</h1>
					{/each}
				</Typewriter>
			</article>
		{/if}
	</main>
{/if}
