// Custom branding logo helpers.
//
// A user-supplied logo is stored as a data URL inside the same persisted
// settings mechanism used for other appearance settings (see
// `src/lib/stores/interface.ts` -> `customLogoStore`). These helpers keep the
// validation logic (allowed types / size cap) pure and framework free so it
// can be unit tested and reused from the settings UI.

export const MAX_CUSTOM_LOGO_BYTES = 512 * 1024; // 512 KB

export const ALLOWED_LOGO_MIME_TYPES = ['image/svg+xml', 'image/png'] as const;

export type LogoValidationError = 'invalidType' | 'tooLarge';

/**
 * Validates a File picked from the "Custom logo" file input.
 * Returns `null` when the file is acceptable, otherwise an error code the
 * caller can map to a translated message.
 */
export function validateLogoFile(file: File): LogoValidationError | null {
	if (!ALLOWED_LOGO_MIME_TYPES.includes(file.type as (typeof ALLOWED_LOGO_MIME_TYPES)[number])) {
		return 'invalidType';
	}

	if (file.size > MAX_CUSTOM_LOGO_BYTES) {
		return 'tooLarge';
	}

	return null;
}

/**
 * Roughly computes the decoded byte size of a `data:` URL, used to
 * re-validate a data URL after it has already been base64 encoded (e.g. when
 * imported from a settings file rather than picked fresh from disk).
 */
export function dataUrlByteLength(dataUrl: string): number {
	const separatorIndex = dataUrl.indexOf(',');
	if (separatorIndex === -1) return 0;

	const base64 = dataUrl.slice(separatorIndex + 1);
	const paddingMatch = base64.match(/=+$/);
	const padding = paddingMatch ? paddingMatch[0].length : 0;

	return Math.floor((base64.length * 3) / 4) - padding;
}

export function isLogoDataUrl(value: string): boolean {
	return /^data:image\/(svg\+xml|png);base64,/.test(value);
}

/** Reads a File as a base64 data URL. */
export function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});
}
