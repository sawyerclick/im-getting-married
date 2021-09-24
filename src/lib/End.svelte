<script>
	import Restart from '$lib/Restart.svelte';
	import Airbnb from './Airbnb.svelte';
	import SekritTheater from './SekritTheater.svelte';
	import { step } from '$stores';

	const restart = () => step.set(0);
</script>

<article
	class="p-4 fixed top-0 right-0 bottom-0 left-0 w-full flex justify-center items-center flex-wrap flex-col"
>
	<!-- <p class="text-lg mb-4 font-serif uppercase font-black">📍 Directions</p> -->
	<section>
		<h1>Ceremony</h1>
		<SekritTheater />
	</section>

	<section class="mt-14">
		<h1>Afterparty</h1>
		<Airbnb />
	</section>

	<section class="absolute bottom-2 text-center">
		<Restart on:click={restart} />
	</section>
</article>
