import { getTrending } from '$lib/api/index';
import { feedCacheStore } from '$lib/store';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';

export async function load() {
	let trending = get(feedCacheStore).trending;

	if (!trending) {
		try {
			trending = await getTrending();
		} catch (trendingError) {
			error(500, trendingError instanceof Error ? trendingError.message : String(trendingError));
		}

		feedCacheStore.set({ ...get(feedCacheStore), trending });
	} else {
		getTrending().then((newTrending) =>
			feedCacheStore.set({ ...get(feedCacheStore), trending: newTrending })
		);
	}
}
