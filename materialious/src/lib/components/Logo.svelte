<script lang="ts">
	import ui from 'beercss';
	import { onMount } from 'svelte';
	import { darkModeStore, themeColorStore } from '../store';
	import { getDynamicTheme } from '../theme/index';

	interface Props {
		classes?: string;
		size?: string;
	}

	let { classes = '', size = '70px' }: Props = $props();

	let fillColor = $state('');

	async function setFill() {
		fillColor = (await getDynamicTheme())['--primary'] ?? '#fff';
	}

	onMount(async () => {
		// Wait for ui to load before setting fill.
		await ui();

		await setFill();
	});

	darkModeStore.subscribe(async () => {
		await setFill();
	});

	themeColorStore.subscribe(async () => {
		await setFill();
	});
</script>

<svg
	class={classes}
	height={size}
	width={size}
	viewBox="0 0 24 24"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="ArikTube"
	><path
		fill={fillColor}
		d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
	/></svg
>
