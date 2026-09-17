import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side middleware: attaches the current Supabase access token to every
 * server-function call so `requireSupabaseAuth` can authenticate the caller.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    if (typeof window !== "undefined") {
      try {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token;
      } catch {
        token = undefined;
      }
    }
    return next(
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
  },
);
