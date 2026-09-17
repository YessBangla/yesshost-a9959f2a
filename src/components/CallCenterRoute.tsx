import { Navigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CallCenterRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      if (!user) { setHasAccess(false); return; }
      const [adminCheck, ccCheck] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as any }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "call_center" as any }),
      ]);
      setHasAccess(!!adminCheck.data || !!ccCheck.data);
    };
    if (!loading) check();
  }, [user, loading]);

  if (loading || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin-login" replace />;
  if (!hasAccess) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default CallCenterRoute;
