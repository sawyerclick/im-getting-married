<script>
	import { getContext } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { step } from '../stores';

	const progress = tweened(0, {
		duration: 400,
		easing: cubicOut
	});

	const { length } = getContext('stuff');

	$: $step, progress.set($step);

	$: pct = ($progress / length) * 100;
</script>

<!-- 
<progress min="0" max={length} value={$progress} class="fixed left-0 top-0  w-full color-red-400" /> -->

<div class=" fixed top-0 left-0 w-full h-6">
	<div class="w-full h-full bg-gray-200 absolute" aria-hidden />
	<div class="h-full bg-yellow-500 absolute" style="width:{pct}%" aria-hidden />
	<p class="z-50 absolute top-1 right-5 leading-none">card {$step} of {length}</p>
</div>
