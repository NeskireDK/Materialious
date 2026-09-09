<script lang="ts">
	import PlaylistSection from '$lib/components/layout/PlaylistSection.svelte';
	import NoResults from '$lib/components/NoResults.svelte';

	let { data } = $props();
</script>

<div class="page right active">
	{#if data.sections.length === 0}
		<NoResults />
	{:else}
		{#each data.sections as section (section.playlistId)}
			<PlaylistSection
				title={section.title}
				playlistId={section.playlistId}
				videos={section.videos}
			/>
		{/each}
	{/if}
</div>
