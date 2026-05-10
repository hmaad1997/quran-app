import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Workplace } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  workplace: Workplace | null;
  loading: boolean;
  initialized: boolean;

  setSession: (session: Session | null) => void;
  loadProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<() => void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      workplace: null,
      loading: false,
      initialized: false,

      setSession: (session) =>
        set({ session, user: session?.user ?? null }),

      loadProfile: async () => {
        const user = get().user;
        if (!user) {
          set({ profile: null, workplace: null });
          return;
        }
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (error) {
          // eslint-disable-next-line no-console
          console.error('[auth] loadProfile', error);
          return;
        }
        let workplace: Workplace | null = null;
        if (profile?.workplace_id) {
          const { data: wp } = await supabase
            .from('workplaces')
            .select('*')
            .eq('id', profile.workplace_id)
            .maybeSingle();
          workplace = (wp as Workplace | null) ?? null;
        }
        set({ profile: (profile as Profile | null) ?? null, workplace });
      },

      signIn: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          set({ loading: false });
          return { error: error.message };
        }
        set({ session: data.session, user: data.user, loading: false });
        await get().loadProfile();
        return {};
      },

      signUp: async (email, password, fullName) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) {
          set({ loading: false });
          return { error: error.message };
        }
        set({ session: data.session, user: data.user, loading: false });
        await get().loadProfile();
        return {};
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null, workplace: null });
      },

      initialize: async () => {
        const { data } = await supabase.auth.getSession();
        set({
          session: data.session,
          user: data.session?.user ?? null,
          initialized: true,
        });
        if (data.session) await get().loadProfile();

        const { data: listener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            set({ session, user: session?.user ?? null });
            if (session) {
              await get().loadProfile();
            } else {
              set({ profile: null, workplace: null });
            }
          },
        );

        return () => listener.subscription.unsubscribe();
      },
    }),
    {
      name: 'basma-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist only non-sensitive flags; supabase-js owns the real session.
      partialize: (state) => ({
        profile: state.profile,
        workplace: state.workplace,
      }),
    },
  ),
);
