<script lang="ts">
	import { resolve } from '$app/paths';
	import ItemsList from '$lib/components/layout/ItemsList.svelte';
	import type { PlaylistPageVideo } from '$lib/api/model';

	interface Props {
		title: string;
		playlistId: string;
		videos: PlaylistPageVideo[];
	}

	let { title, playlistId, videos }: Props = $props();
</script>

<a class="section-link" href={resolve('/playlist/[slug]', { slug: playlistId })}>
	<h6 class="no-margin">{title}</h6>
	<i>chevron_right</i>
</a>
<ItemsList items={videos} {playlistId} classes="" />

<style>
	.section-link {
		display: flex;
		align-items: center;
		gap: 0.25em;
		padding: 1em 1em 0.5em;
		color: inherit;
	}
</style>
