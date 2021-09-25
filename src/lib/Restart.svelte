<script>
	import { fly } from 'svelte/transition';
	import { getContext } from 'svelte';
	const step = getContext('step');
</script>

<button
	transition:fly={{ y: 100 }}
	class="transition-all font-mono text-xl flex justify-center items-center mx-auto"
	on:click
	disabled={$step === 0}
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1.25rem"
		height="1.25rem"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="3"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="feather feather-rotate-ccw restart inline-block mr-1"
		><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg
	>
	Replay
</button>
