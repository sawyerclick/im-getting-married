<script>
	import { onMount } from 'svelte';
	import * as confetti from 'canvas-confetti';

	var colors = ['#5E32BA', '#E97F4D', '#EB6123', '#18181A', '#BFDA7A', '#95C457'];

	let canvas;
	onMount(() => {
		canvas.confetti = canvas.confetti || confetti.create(canvas, { resize: true });

		var end = Date.now() + 15 * 1000;
		const shootConfetti = () => {
			canvas.confetti({
				particleCount: 200,
				angle: 60,
				spread: 55,
				origin: { x: 0, y: 1 },
				colors: colors
			});
			canvas.confetti({
				particleCount: 200,
				angle: 120,
				spread: 55,
				origin: { x: 1, y: 1 },
				colors: colors
			});
		};
		shootConfetti();

		if (Date.now() < end) requestAnimationFrame(shootConfetti);
	});
</script>

<canvas class="absolute w-full h-full z-50 pointer-events-none" bind:this={canvas} aria-hidden />
