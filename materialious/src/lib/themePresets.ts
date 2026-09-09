// Named theme color presets shown in the appearance settings.
//
// Selecting a preset just sets `themeColorStore` to the preset's color, the
// same store the free color picker and `VITE_DEFAULT_SETTINGS` seeding
// already use, so no other part of the app needs to know presets exist.

export interface ThemePreset {
	id: string;
	name: string;
	color: string;
}

export const CUSTOM_THEME_LABEL = 'Custom';

export const THEME_PRESETS: ThemePreset[] = [
	{ id: 'red-devil', name: 'Red Devil', color: '#cc0000' },
	{ id: 'deep-blue', name: 'Deep Blue', color: '#1565c0' },
	{ id: 'forest-green', name: 'Forest Green', color: '#2e7d32' },
	{ id: 'amber', name: 'Amber', color: '#f59e0b' },
	{ id: 'royal-purple', name: 'Royal Purple', color: '#7c3aed' },
	{ id: 'slate', name: 'Slate', color: '#475569' }
];

/**
 * Resolves which preset (if any) matches the given theme color, returning
 * `Custom` when the color doesn't match a known preset (including when no
 * color is set yet).
 */
export function resolvePresetName(color: string | null | undefined): string {
	const preset = findPresetByColor(color);
	return preset ? preset.name : CUSTOM_THEME_LABEL;
}

export function findPresetByColor(color: string | null | undefined): ThemePreset | undefined {
	if (!color) return undefined;

	const normalized = color.trim().toLowerCase();
	return THEME_PRESETS.find((preset) => preset.color.toLowerCase() === normalized);
}
