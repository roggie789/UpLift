import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { mmkvStorage } from './storage';

const HOUR = 60 * 60 * 1000;

/**
 * Stale times per data type (see the Caching Strategy doc on the Miro board).
 * Cached data is served instantly; refetches only happen past these windows.
 */
export const staleTimes = {
  exerciseLibrary: 24 * HOUR,
  templates: 1 * HOUR,
  history: 1 * HOUR,
  profile: 5 * 60 * 1000,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: staleTimes.templates,
      gcTime: 7 * 24 * HOUR, // keep a week of cache on disk for offline use
      retry: 2,
    },
  },
});

export const queryPersister = createSyncStoragePersister({
  storage: mmkvStorage,
  key: 'uplift-query-cache',
});
