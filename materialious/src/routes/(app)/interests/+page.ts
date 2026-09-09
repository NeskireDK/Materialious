import { getPersonalPlaylists } from '$lib/api/index';
import type { PlaylistPage } from '$lib/api/model';

const SECTION_PLAYLIST_TITLES = ['Music: discover', 'Cars', 'Gaming', 'Science & tech'];
const VIDEOS_PER_SECTION = 8;

export async function load() {
	const playlists = await getPersonalPlaylists();

	const sections = SECTION_PLAYLIST_TITLES.map((title) =>
		playlists.find((playlist) => playlist.title === title)
	)
		.filter((playlist): playlist is PlaylistPage => playlist !== undefined)
		.map((playlist) => ({
			title: playlist.title,
			playlistId: playlist.playlistId,
			videos: playlist.videos.slice(0, VIDEOS_PER_SECTION)
		}))
		.filter((section) => section.videos.length > 0);

	return { sections };
}
