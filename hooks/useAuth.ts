import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getOrCreateDriver } from '@/lib/api';
import { useStore } from '@/lib/store';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { driver, setDriver } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadDriver(session.user.id, session.user.email ?? '');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          loadDriver(session.user.id, session.user.email ?? '');
        } else {
          setDriver(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadDriver(userId: string, email: string) {
    const d = await getOrCreateDriver(userId, email);
    setDriver(d);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, driver, loading, signOut };
}