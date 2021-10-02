<script>
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import Airbnb from './Airbnb.svelte';
	import SekritTheater from './SekritTheater.svelte';

	const { length } = getContext('stuff');
	const step = getContext('step');
</script>

{#if $step >= length}
	<article
		transition:fly={{ y: 200 }}
		class="p-4 fixed top-0 right-0 bottom-0 left-0 w-full flex justify-center items-center flex-wrap flex-col"
	>
		<section>
			<h1>Ceremony</h1>
			<SekritTheater />
		</section>

		<section class="mt-14">
			<h1>Afterparty</h1>
			<Airbnb />
		</section>
	</article>
{/if}
