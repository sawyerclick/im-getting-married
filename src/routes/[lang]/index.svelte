<script context="module">
	export async function load({ page }) {
		return {
			status: 303,
			redirect: `/${page.params.lang}/invitation`
		};
	}
</script>
