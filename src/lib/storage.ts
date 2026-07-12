import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Async key-value storage used by the TanStack Query persister and
 * Supabase auth session storage.
 *
 * AsyncStorage works inside Expo Go. Swap for react-native-mmkv later
 * if we move to a dev build and want synchronous, faster storage.
 */
export const kvStorage = AsyncStorage;
