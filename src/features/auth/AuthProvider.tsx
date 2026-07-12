import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { createSessionFromUrl } from '@/lib/authRedirect';

interface AuthState {
  session: Session | null;
  /** True until the persisted session has been restored from storage. */
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, isLoading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT') {
        // Drop cached templates/history so the next account starts clean
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle email-confirmation (and other auth) deep links
  useEffect(() => {
    async function handleUrl(url: string) {
      try {
        await createSessionFromUrl(url);
      } catch (error) {
        console.error('Auth deep link failed:', error);
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
}
