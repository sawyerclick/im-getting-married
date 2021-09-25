<script>
	import { setContext, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Typewriter from 'svelte-typewriter';
	import Progress from '$lib/Progress.svelte';
	import SekritTheater from '$lib/SekritTheater.svelte';
	import Airbnb from '$lib/Airbnb.svelte';
	import Confetti from '$lib/Confetti.svelte';
	import End from '$lib/End.svelte';
	import invitation from '$data/invitation.json';
	const match = invitation[0],
		lang = 'english',
		otherLangs = ['espanol'];

	const { cards } = match;

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

	onMount(() => {
		mounted = true;
		$step = 0;
	});

	$: activeCard = cards[$step];
	$: mounted = false;
</script>

<svelte:head>
	<title>{match.title}</title>
	<meta property="og:url" content="https://married.sawyer.codes/invitation/{lang}" />
</svelte:head>

{#if mounted}
	<div class="flex items-center justify-center h-full w-full min-h-screen text-center">
		{#if activeCard.special}
			{#each activeCard.special as special}
				<svelte:component this={specials.get(special)} />
			{/each}
		{/if}

		<Progress />

		{#each otherLangs as otherLang}
			<a
				sveltekit:prefetch
				href="/invitation/{otherLang}"
				class="z-50 absolute top-2 left-2 leading-none text-md font-mono transition hover:text-purple-700 hover:underline"
			>
				{otherLang}</a
			>
		{/each}

		{#if activeCard.text}
			<article class="p-4 ">
				<Typewriter interval={85} cascade cursor={false} delay={$step ? config.delay : 0}>
					{#each activeCard.text as line}
						<h1>{@html line}</h1>
					{/each}
				</Typewriter>
			</article>
		{/if}
	</div>

	<section class="absolute w-full flex justify-between bottom-2 text-4xl px-4 ">
		<button
			on:click={() => ($step = $step - 1)}
			class:invisible={$step === 0}
			aria-hidden={$step === 0}>👈</button
		>
		<button
			on:click={() => ($step = $step + 1)}
			class:invisible={$step === config.length}
			aria-hidden={$step === config.length}>👉</button
		>
	</section>
{/if}
