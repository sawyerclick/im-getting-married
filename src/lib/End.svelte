<script>
	import Airbnb from './Airbnb.svelte';
	import SekritTheater from './SekritTheater.svelte';
</script>

<article
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
