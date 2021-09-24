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

<div class="fixed top-0 left-0 w-full h-1">
	<div class="w-full h-full bg-gray-200 absolute" aria-hidden />
	<div class="h-full bg-purple-700 absolute" style="width:{pct}%" aria-hidden />
	<p class="z-50 absolute top-2 right-2 leading-none text-lg">card {$step} of {length}</p>
</div>
