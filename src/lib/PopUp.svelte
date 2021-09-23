<script>
	import { getContext } from 'svelte';
	import { step } from '../stores';
	import { fly } from 'svelte/transition';
	export let link, text;

	const { length } = getContext('stuff');
</script>

<a
	in:fly={{ y: 100 }}
	out:fly={{ y: 100 }}
	class="bottom-6 block p-2 mt-4 leading-none rounded-lg text-xl font-serif uppercase w-auto transition hover:-translate-y-2 hover:shadow-lg"
	class:fixed={$step != length}
	href={link}
	target="_blank">{text}</a
>
