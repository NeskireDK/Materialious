<script lang="ts">
	import ItemsList from '$lib/components/layout/ItemsList.svelte';
	import { feedCacheStore } from '$lib/store';
</script>

<ItemsList items={$feedCacheStore.trending ?? []} />
