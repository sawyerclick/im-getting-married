<script>
	import Invitation from '$lib/__invitation.svelte';
	import invitation from '$data/invitation.json';
	const otherLang = 'espanol';
</script>

<Invitation cards={invitation[0].body} {otherLang} />
