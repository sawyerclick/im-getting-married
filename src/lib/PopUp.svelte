<script>
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	export let link, text;
	const step = getContext('step');
	const { length } = getContext('stuff');
</script>

<a
	transition:fly={{ y: 100 }}
	class="bottom-10 block p-4 mt-4 leading-none border-none text-center rounded-lg text-xl font-serif uppercase w-auto bg-transparent transition mx-0 hover:-translate-y-2 hover:shadow-lg hover:scale-110 hover:bg-transparent hover:text-black"
	class:fixed={$step != length}
	href={link}
	target="_blank">{text}</a
>
