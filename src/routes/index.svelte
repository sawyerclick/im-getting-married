<script>
	import { setContext } from 'svelte';
	import '../app.postcss';
	import '../font.css';
	import Typewriter from 'svelte-typewriter';
	import Confetti from '../lib/Confetti.svelte';
	import Progress from '../lib/Progress.svelte';
	import cards from '../cards.json';
	import { step } from '../stores';

	setContext('stuff', {
		length: cards.length - 1,
		cards
	});

	const advanceCard = () => setTimeout(() => step.set($step + 1), 1000);

	$: activeCard = cards[$step];
</script>

<main
	class="flex items-center justify-center h-full w-full min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 text-center"
>
	{#if activeCard.confetti}
		<Confetti />
	{/if}

	<Progress />

	<Typewriter interval={100} cascade cursor={false} delay={400} on:done={advanceCard}>
		{#each activeCard.text as line}
			<h1>{@html line}</h1>
		{/each}
	</Typewriter>

	<!-- <button>previou</button>
	<button>next</button> -->
</main>
