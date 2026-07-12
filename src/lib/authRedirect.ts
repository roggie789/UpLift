import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabase';

/** Deep-link path Supabase redirects to after email confirmation. */
export const AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * Redirect URI embedded in confirmation emails.
 * Expo Go uses an exp:// URL; dev/production builds use uplift:// from app.json.
 */
export function getAuthRedirectUri(): string {
  return makeRedirectUri({ path: AUTH_CALLBACK_PATH });
}

/** Exchange tokens from a Supabase auth redirect URL for a persisted session. */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return null;

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return data.session;
}
