import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: "admin" | "customer" | "super_admin" | string;
  phone?: string;
  email?: string;
  restaurant_id?: string | null;
  is_paid?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isSuperAdmin: boolean;
  isAdminPaid: boolean;
  setMockSession: (session: Session | null, profile: Profile | null) => void;
  softRevalidateSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mounted = React.useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Refs to avoid stale closures inside long-lived callbacks
  const sessionRef = React.useRef<Session | null>(null);
  const userRef = React.useRef<User | null>(null);
  const profileRef = React.useRef<Profile | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const refreshWithTimeout = async (ms = 3000) => {
    return Promise.race([
      // supabase v2: refreshSession() returns { data, error }
      supabase.auth.refreshSession(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("refresh-timeout")), ms)),
    ]);
  };

  const waitForClientAuth = async (
    expectedUserId: string,
    maxAttempts = 8,
    delayMs = 300
  ) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const { data } = await supabase.auth.getSession();
        const clientUserId = data?.session?.user?.id;
        if (clientUserId === expectedUserId) {
          return true;
        }
      } catch (e) {
        // ignore and retry
      }
      await new Promise((res) => setTimeout(res, delayMs));
      attempts++;
    }
    return false;
  };

  const settleSessionState = useCallback(
    async (currentSession: Session | null, finishLoading: () => void) => {
      if (!mounted.current) return;

      // Use refs for previous values (avoid stale closures)
      const prevSession = sessionRef.current;
      const prevUser = userRef.current;
      const prevProfile = profileRef.current;

      // Update session & user if changed
      if (
        prevSession?.access_token !== currentSession?.access_token ||
        prevUser?.id !== currentSession?.user?.id
      ) {
        setSession(currentSession);
        sessionRef.current = currentSession;
        console.log("[SessionContext] setSession updated.");
      } else {
        console.log("[SessionContext] setSession ignored (no change).");
      }

      if (prevUser?.id !== currentSession?.user?.id) {
        setUser(currentSession?.user || null);
        userRef.current = currentSession?.user || null;
        console.log("[SessionContext] setUser updated.");
      } else {
        console.log("[SessionContext] setUser ignored (no change).");
      }

      let fetchedProfile: Profile | null = null;

      try {
        if (currentSession?.user) {
          const userId = currentSession.user.id;
          console.log("SessionContext: Attempting to fetch profile for user ID:", userId);

          const clientAuthReady = await waitForClientAuth(userId, 6, 300);
          if (!clientAuthReady) {
            console.warn(
              "SessionContext: client not authenticated for safe profile fetch. Will attempt read anyway (may fail due to RLS)."
            );
          } else {
            console.log("SessionContext: client authenticated for user:", userId);
          }

          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .single();

            console.log("SessionContext: profiles select result:", { data, error });

            if (error) {
              // handle "no rows" gracefully; log other errors
              if ((error as any).code === "PGRST116") {
                console.warn("SessionContext: Profile not found for user ID:", userId);
              } else {
                console.error(
                  "SessionContext: Error fetching profile from Supabase (code:",
                  (error as any).code,
                  "):",
                  error
                );
                // show a user-friendly toast (optional)
                toast.error(`Error fetching your profile: ${(error as any).message}.`);
              }
            } else if (data) {
              fetchedProfile = data as Profile;
              console.log("SessionContext: Profile found successfully:", fetchedProfile);
            }
          } catch (selectErr) {
            console.error("SessionContext: Unexpected exception while selecting profile:", selectErr);
          }

          if (!fetchedProfile) {
            const roleFromMeta =
              currentSession.user.app_metadata?.role ||
              currentSession.user.user_metadata?.role ||
              currentSession.user.user_metadata?.roles ||
              undefined;

            const normalizedRole = roleFromMeta ? String(roleFromMeta).toLowerCase() : undefined;

            if (normalizedRole === "admin" || normalizedRole === "super_admin") {
              fetchedProfile = {
                id: currentSession.user.id,
                first_name: currentSession.user.user_metadata?.first_name || "",
                last_name: currentSession.user.user_metadata?.last_name || "",
                email: currentSession.user.email || "",
                role: normalizedRole === "super_admin" ? "super_admin" : "admin",
                avatar_url: currentSession.user.user_metadata?.avatar_url || undefined,
                restaurant_id: currentSession.user.user_metadata?.restaurant_id || null,
                is_paid: false,
              };
              console.log("SessionContext: Built temporary profile from session metadata:", fetchedProfile);
            } else {
              const canUpsert = await waitForClientAuth(userId, 6, 300);
              if (canUpsert) {
                try {
                  const profileToUpsert = {
                    id: userId,
                    first_name: currentSession.user.user_metadata?.first_name || "",
                    last_name: currentSession.user.user_metadata?.last_name || "",
                    email: currentSession.user.email || "",
                    role: "customer",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    restaurant_id: currentSession.user.user_metadata?.restaurant_id || null,
                    is_paid: false,
                  };
                  console.log("SessionContext: Attempting safe upsert of profile:", profileToUpsert);

                  const { data: newProfileData, error: upsertError } = await supabase
                    .from("profiles")
                    .upsert(profileToUpsert, { onConflict: "id" })
                    .select("*")
                    .single();

                  if (upsertError) {
                    console.error("SessionContext: Error during profile upsert:", upsertError);
                    toast.error(`Error creating/updating your profile: ${upsertError.message}.`);
                  } else {
                    fetchedProfile = newProfileData as Profile;
                    toast.success("Profile created/updated successfully!");
                    console.log("SessionContext: Profile upserted successfully:", fetchedProfile);
                  }
                } catch (upsertException) {
                  console.error("SessionContext: Unexpected error during upsert:", upsertException);
                }
              } else {
                console.warn(
                  "SessionContext: Skipping upsert because client is not authenticated for this session user yet."
                );
              }
            }
          }
        } else {
          // No user -> clear profile if previously set
          if (profileRef.current !== null) {
            setProfile(null);
            profileRef.current = null;
            console.log("SessionContext: Cleared profile because no active user in session.");
          }
          console.log("SessionContext: No active user in session, skipping profile fetch.");
        }
      } catch (profileFetchError) {
        console.error(
          "SessionContext: Unexpected error during profile fetch/upsert in settleSessionState:",
          profileFetchError
        );
        toast.error("Unexpected error loading/creating your profile.");
      } finally {
        if (mounted.current) {
          const shouldUpdate =
            profileRef.current?.id !== fetchedProfile?.id ||
            profileRef.current?.role !== fetchedProfile?.role ||
            profileRef.current?.is_paid !== fetchedProfile?.is_paid ||
            profileRef.current?.restaurant_id !== fetchedProfile?.restaurant_id;

          if (shouldUpdate) {
            setProfile(fetchedProfile);
            profileRef.current = fetchedProfile;
            console.log("[SessionContext] setProfile called due to change.");
          } else {
            console.log("[SessionContext] setProfile ignored (no change).");
          }

          console.log(
            `[SessionContext] Perfil definido. Role: ${fetchedProfile?.role}, Restaurant ID: ${fetchedProfile?.restaurant_id}, Is Paid: ${fetchedProfile?.is_paid}`
          );
          finishLoading();
          console.log(
            "SessionContext: State settled. Session:",
            currentSession?.user?.id ? "Active" : "None",
            "Profile Role:",
            fetchedProfile?.role,
            "Restaurant ID:",
            fetchedProfile?.restaurant_id
          );
        }
      }
    },
    [/* stable via refs */]
  );

  const softRevalidateSession = useCallback(async () => {
    if (!mounted.current) return;
    console.log("SessionContext: softRevalidateSession acionado.");
    setIsLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session ?? null;
      await settleSessionState(currentSession, () => setIsLoading(false));
    } catch (error) {
      console.error("SessionContext: Erro em softRevalidateSession:", error);
      await settleSessionState(null, () => setIsLoading(false));
    }
  }, [settleSessionState]);

  const revalidateSession = useCallback(
    async (event: string = "MANUAL_REVALIDATE", showLoading: boolean = true) => {
      if (!mounted.current) return;

      const finishLoading = () => {
        if (showLoading) setIsLoading(false);
      };

      if (showLoading) {
        setIsLoading(true);
      }
      console.log(`SessionContext: revalidateSession acionado por ${event}. showLoading: ${showLoading}.`);

      try {
        const { data } = await supabase.auth.getSession();
        let activeSession = data?.session ?? null;

        try {
          // try refresh but don't fail hard if it times out
          const refreshResult: any = await refreshWithTimeout();
          if (refreshResult?.data?.session) {
            activeSession = refreshResult.data.session;
          }
        } catch (e: any) {
          console.warn(
            `SessionContext: refreshSession falhou ou excedeu o tempo limite (${e?.message ?? e}). Prosseguindo com a sessão atual.`
          );
        }
        await settleSessionState(activeSession, finishLoading);
      } catch (error) {
        console.error("SessionContext: Erro inesperado durante revalidateSession:", error);
        await settleSessionState(null, finishLoading);
      }
    },
    [settleSessionState]
  );

  useEffect(() => {
    let authSubscription: any;

    const finishLoadingOnAuthChange = () => setIsLoading(false);

    // initial load
    revalidateSession("INITIAL_LOAD");

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted.current) return;
      setIsLoading(true);
      settleSessionState(newSession ?? null, finishLoadingOnAuthChange);
    });

    authSubscription = data?.subscription;

    const onFocus = () => revalidateSession("WINDOW_FOCUS", false);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        revalidateSession("VISIBILITY_CHANGE", false);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      console.log("SessionContext: Limpando listeners.");
      if (authSubscription && typeof authSubscription.unsubscribe === "function") {
        authSubscription.unsubscribe();
      }
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // settleSessionState and revalidateSession are stable via useCallback + refs
  }, [revalidateSession, settleSessionState]);

  const isAdmin = useMemo(() => profile?.role === "admin" || profile?.role === "super_admin", [profile]);
  const isCustomer = useMemo(() => profile?.role === "customer", [profile]);
  const isSuperAdmin = useMemo(() => profile?.role === "super_admin", [profile]);
  const isAdminPaid = useMemo(() => profile?.role === "admin" && profile?.is_paid === true, [profile]);

  const setMockSession = useCallback((newSession: Session | null, newProfile: Profile | null) => {
    console.log("SessionContext: Definindo sessão mockada.");
    setSession(newSession);
    sessionRef.current = newSession;
    setUser(newSession?.user || null);
    userRef.current = newSession?.user || null;
    setProfile(newProfile);
    profileRef.current = newProfile;
    setIsLoading(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      session,
      user,
      profile,
      isLoading,
      isAdmin,
      isCustomer,
      isSuperAdmin,
      isAdminPaid,
      setMockSession,
      softRevalidateSession,
    }),
    [session, user, profile, isLoading, isAdmin, isCustomer, isSuperAdmin, isAdminPaid, setMockSession, softRevalidateSession]
  );

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
