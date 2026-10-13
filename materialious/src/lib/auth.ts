import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { get } from 'svelte/store';
import {
	authTokenStore,
	invidiousAuthStore,
	autoLoginStore,
	channelCacheStore,
	feedCacheStore,
	invidiousInstanceStore,
	materialiousBackendStore,
	playlistCacheStore,
	rawMasterKeyStore,
	searchCacheStore
} from './store';
import { Capacitor } from '@capacitor/core';
import { isOwnBackend } from './shared';
import { isAndroidTv } from './platform';
import { Browser } from '@capacitor/browser';
import { clearFeedYTjs } from './api/youtubejs/subscriptions';
import { ensureNoTrailingSlash } from './utils';
import { isMaterialiousAccountActive, isYTBackend } from './backend';
import { deleteKeyValue, getKeyValue } from './api/backend/keyvalue';
import semver from 'semver';
import { configBackend } from './api/backend';
import { backendFetch } from './api/backend/request';
import { configBackendCache } from './stores/backend';

// sessionStorage key used to make sure auto-login is only attempted once per
// browser session, so a cancelled/failed authorization never redirect-loops.
const AUTO_LOGIN_SESSION_KEY = 'materialiousAutoLoginAttempted';

export function clearCaches() {
	feedCacheStore.set({});
	searchCacheStore.set({});
	playlistCacheStore.set({});
	channelCacheStore.set({});
}

export function authProtected() {
	if (!get(invidiousAuthStore) && !isYTBackend()) {
		goto(resolve('/', {}), { replaceState: true });
	}
}

async function removeAuthFromBackend() {
	if (!get(rawMasterKeyStore)) return;

	await deleteKeyValue('authToken');
}

export async function syncAuthTokenFromCloud(): Promise<void> {
	if (!get(rawMasterKeyStore)) return;

	// On the web `isOwnBackend()` reads from `configBackendCache`, which is
	// populated asynchronously. Resolve it here so the sync does not depend on
	// a race between QuickConnect and the config fetch in the layout.
	if (!isOwnBackend()) {
		const config = await configBackend();
		if (!config) return;
		configBackendCache.set(config);
	}

	if (!isMaterialiousAccountActive()) return;

	try {
		const authTokenFromCloud = await getKeyValue('authToken');
		if (typeof authTokenFromCloud === 'string')
			invidiousAuthStore.set(JSON.parse(authTokenFromCloud));
		else invidiousAuthStore.set(null);
	} catch {
		// Remote Materialious instance is unreachable; log out of the account.
		authTokenStore.set(undefined);
		rawMasterKeyStore.set(undefined);
		invidiousAuthStore.set(null);
	}
}

export async function setInvidiousInstance(
	instanceUrl: string | undefined | null
): Promise<boolean> {
	if (typeof instanceUrl !== 'string') {
		return false;
	}

	let invalidInstance = false;

	const instance = ensureNoTrailingSlash(instanceUrl).toLowerCase();

	try {
		new URL(instance);
	} catch {
		invalidInstance = true;
	}

	if (invalidInstance) return false;

	let resp;
	try {
		resp = await fetch(`${instance}/api/v1/channels/UCH-_hzb2ILSCo9ftVSnrCIQ`);
	} catch {
		invalidInstance = true;
	}

	if (invalidInstance) return false;

	if (resp && !resp.ok) {
		return false;
	}

	invidiousInstanceStore.set(instance);
	invidiousAuthStore.set(null);

	await removeAuthFromBackend();

	return true;
}

export async function goToInvidiousLogin() {
	if (!get(invidiousInstanceStore)) return;
	const path = new URL(`${get(invidiousInstanceStore)}/authorize_token`);
	const searchParams = new URLSearchParams({
		scopes: ':feed,:subscriptions*,:playlists*,:history*,:notifications*'
	});
	if (Capacitor.getPlatform() === 'android') {
		searchParams.set('callback_url', 'materialious-auth://');
		path.search = searchParams.toString();
		await Browser.open({ url: path.toString() });
	} else {
		searchParams.set('callback_url', `${location.origin}${resolve('/invidious/auth', {})}`);
		path.search = searchParams.toString();
		document.location.href = path.toString();
	}
}

function hasAutoLoginBeenAttemptedThisSession(): boolean {
	try {
		return sessionStorage.getItem(AUTO_LOGIN_SESSION_KEY) !== null;
	} catch {
		// sessionStorage unavailable (e.g. private browsing) - treat as already
		// attempted so we never risk a loop.
		return true;
	}
}

function markAutoLoginAttempted(): void {
	try {
		sessionStorage.setItem(AUTO_LOGIN_SESSION_KEY, '1');
	} catch {
		// Nothing we can do if sessionStorage is unavailable.
	}
}

/**
 * Decides whether the silent auto-login flow should run for the given
 * current pathname. Pulled out of `attemptAutoLogin` so the guard logic can
 * be exercised without needing to actually kick off a redirect.
 */
export function shouldAttemptAutoLogin(currentPathname: string): boolean {
	if (!get(autoLoginStore)) return false;

	// Already have a token, nothing to do.
	if (get(invidiousAuthStore)) return false;

	// Android TV has its own (non-redirect) login dialog.
	if (isAndroidTv()) return false;

	// Own-backend internal auth and the YouTube backend don't use the
	// Invidious token-authorization redirect flow.
	if (isOwnBackend()?.internalAuth) return false;
	if (isYTBackend()) return false;

	// Nothing to authorize against.
	if (!get(invidiousInstanceStore)) return false;

	// Never fire while we're mid-callback on the token-authorization return path.
	if (currentPathname === resolve('/invidious/auth', {})) return false;

	if (hasAutoLoginBeenAttemptedThisSession()) return false;

	return true;
}

/**
 * Silently starts the same Invidious token-authorization redirect flow the
 * manual "Login" button uses (see `goToInvidiousLogin`), but only once per
 * browser session and only when there's no stored token yet. Gated behind
 * the `autoLogin` setting (default off), seedable via VITE_DEFAULT_SETTINGS
 * the same way as `themeColor`.
 */
export async function attemptAutoLogin(currentPathname: string): Promise<void> {
	if (!shouldAttemptAutoLogin(currentPathname)) return;

	// Mark as attempted before redirecting so a cancelled/failed
	// authorization never retries until the next session.
	markAutoLoginAttempted();

	await goToInvidiousLogin();
}

export async function invidiousLogout() {
	invidiousAuthStore.set(null);
	await removeAuthFromBackend();

	goto(resolve('/', {}));
}

export async function materialiousLogout() {
	if (isYTBackend()) {
		await clearFeedYTjs();
	}

	if (isOwnBackend()?.internalAuth) {
		backendFetch('/api/user/logout', { method: 'DELETE' }).catch(() => {
			// Remote instance unreachable.
		});
		authTokenStore.set(undefined);
		rawMasterKeyStore.set(undefined);
		clearCaches();
	}

	goto(resolve('/', {}));
}

export async function setMaterialiousBackend(
	instanceUrl: string | undefined | null
): Promise<boolean> {
	if (typeof instanceUrl !== 'string') {
		return false;
	}

	let invalid = false;

	const backend = ensureNoTrailingSlash(instanceUrl).toLowerCase();

	try {
		new URL(backend);
	} catch {
		invalid = true;
	}

	if (invalid) return false;

	let resp;
	try {
		resp = await fetch(`${backend}/api/config`);
	} catch {
		invalid = true;
	}

	if (invalid) return false;

	if (resp && !resp.ok) {
		return false;
	}

	try {
		const config = await resp?.json();
		if (config?.backend !== 'materialious' || !config?.internalAuth) {
			return false;
		}
		if (!config?.version || !semver.gte(config.version, '1.17.15')) {
			return false;
		}
	} catch {
		return false;
	}

	materialiousBackendStore.set(backend);
	await removeAuthFromBackend();
	authTokenStore.set(undefined);
	rawMasterKeyStore.set(undefined);

	return true;
}

export async function removeMaterialiousBackend() {
	if (isOwnBackend()?.internalAuth) {
		backendFetch('/api/user/logout', { method: 'DELETE' }).catch(() => {
			// Remote instance unreachable.
		});
	}

	configBackendCache.set(undefined);
	materialiousBackendStore.set(undefined);
	authTokenStore.set(undefined);
	rawMasterKeyStore.set(undefined);
	clearCaches();
}
