import { useEffect, useState } from "react";
import { Server, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  suspended: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive",
};

const DashboardServices = () => {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("services").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { setServices(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{tr("dash.myServices")}</h1>
          <p className="text-sm text-muted-foreground">{tr("dash.allServices")}</p>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Server className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">{tr("dash.noServices")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{tr("dash.noServicesDesc")}</p>
          <a href="/#pricing" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold">
            {tr("dash.browsePlans")} <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <div key={service.id} className="glass-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Server className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{service.name}</h3>
                    <p className="text-xs text-muted-foreground">{service.domain || "No domain"} • {service.plan || service.service_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[service.status] || ""}`}>{service.status}</span>
                  <span className="text-sm font-bold text-foreground">৳{service.price_bdt}/{service.billing_cycle}</span>
                </div>
              </div>
              {service.expiry_date && <p className="text-xs text-muted-foreground mt-3">{tr("dash.expires")} {new Date(service.expiry_date).toLocaleDateString("bn-BD")}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardServices;
