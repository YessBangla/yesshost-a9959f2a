import { useEffect, useState } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

const DashboardDomains = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<Tables<"services">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("services")
      .select("*")
      .eq("user_id", user.id)
      .eq("service_type", "domain")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDomains(data || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Domains</h1>
          <p className="text-sm text-muted-foreground">আপনার রেজিস্টার্ড ডোমেইনগুলো</p>
        </div>
        <a href="/#domain" className="flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20">
          Register Domain
        </a>
      </div>

      {domains.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">কোনো ডোমেইন নেই</h3>
          <p className="text-sm text-muted-foreground mb-4">আপনার এখনো কোনো ডোমেইন রেজিস্টার করা হয়নি।</p>
          <a href="/#domain" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold">
            Search Domains <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {domains.map(d => (
            <div key={d.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{d.domain || d.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Expires: {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString("bn-BD") : "N/A"}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                d.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              }`}>{d.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardDomains;
