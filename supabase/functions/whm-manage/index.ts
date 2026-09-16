import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface WHMRequest {
  action: 'create_account' | 'suspend_account' | 'unsuspend_account' | 'terminate_account' | 'list_accounts' | 'account_summary' | 'test_connection' | 'token_status' | 'save_token' | 'remove_token';
  reseller_package_id: string;
  api_token?: string;
  account_id?: string;
  // For create_account
  domain?: string;
  username?: string;
  password?: string;
  email?: string;
  plan_name?: string;
  disk_quota_mb?: number;
  bandwidth_mb?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: WHMRequest = await req.json();
    const { action, reseller_package_id } = body;

    // Admins may manage any package; resellers only their own
    const { data: isAdmin } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });

    const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const envToken = Deno.env.get('WHM_API_TOKEN') || '';
    const loadStoredToken = async (): Promise<string> => {
      const { data } = await supabaseClient
        .from('communication_config')
        .select('config_value, is_active')
        .eq('config_key', 'whm_api')
        .maybeSingle();
      if (!data || data.is_active === false) return '';
      return (data.config_value as any)?.api_token || '';
    };
    const mask = (t: string) => t.length <= 8 ? '••••' : `${t.slice(0, 4)}${'•'.repeat(8)}${t.slice(-4)}`;

    // ---- Token management (admin only, no package needed) ----
    if (action === 'token_status' || action === 'save_token' || action === 'remove_token') {
      if (!isAdmin) return json({ error: 'Admin only' }, 403);

      if (action === 'save_token') {
        const t = (body.api_token || '').trim();
        if (t.length < 8) return json({ error: 'Token looks too short' }, 400);
        const { error: upErr } = await supabaseClient
          .from('communication_config')
          .upsert({
            config_key: 'whm_api',
            config_value: { api_token: t },
            is_active: true,
            description: 'WHM API token (server-side only, never exposed to the browser)',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'config_key' });
        if (upErr) return json({ error: upErr.message }, 500);
        return json({ success: true, configured: true, masked: mask(t), source: 'database' });
      }

      if (action === 'remove_token') {
        const { error: delErr } = await supabaseClient
          .from('communication_config')
          .delete()
          .eq('config_key', 'whm_api');
        if (delErr) return json({ error: delErr.message }, 500);
        return json({
          success: true,
          configured: !!envToken,
          masked: envToken ? mask(envToken) : null,
          source: envToken ? 'secret' : null,
        });
      }

      const stored = await loadStoredToken();
      const active = stored || envToken;
      return json({
        success: true,
        configured: !!active,
        masked: active ? mask(active) : null,
        source: stored ? 'database' : (envToken ? 'secret' : null),
      });
    }

    let pkgQuery = supabaseClient
      .from('reseller_packages')
      .select('*')
      .eq('id', reseller_package_id);
    if (!isAdmin) pkgQuery = pkgQuery.eq('user_id', user.id);
    const { data: pkg, error: pkgError } = await pkgQuery.single();

    if (pkgError || !pkg) {
      return new Response(JSON.stringify({ error: 'Reseller package not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pkg.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Reseller package is not active' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // WHM API helper
    const WHM_API_TOKEN = (await loadStoredToken()) || envToken;
    const whmCall = async (func: string, params: Record<string, string> = {}) => {
      if (!pkg.whm_server_host || !pkg.whm_username) {
        throw new Error('WHM server not configured for this package');
      }
      
      if (!WHM_API_TOKEN) {
        throw new Error('WHM_API_TOKEN not configured');
      }

      const url = new URL(`https://${pkg.whm_server_host}:2087/json-api/${func}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      url.searchParams.set('api.version', '1');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `whm ${pkg.whm_username}:${WHM_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`WHM API error [${response.status}]: ${text}`);
      }

      return response.json();
    };

    let result: any;

    switch (action) {
      case 'create_account': {
        if (!body.domain || !body.username || !body.password) {
          return new Response(JSON.stringify({ error: 'domain, username, password required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Check quota
        if (pkg.used_accounts >= pkg.max_accounts) {
          return new Response(JSON.stringify({ error: 'Account limit reached' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const diskQuota = body.disk_quota_mb || 1000;
        if (pkg.used_disk_mb + diskQuota > pkg.max_disk_mb) {
          return new Response(JSON.stringify({ error: 'Disk quota would exceed limit' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // A real cPanel account is created whenever the server host + API token are present.
        const whmReady = !!(pkg.whm_server_host && pkg.whm_username && WHM_API_TOKEN);
        let cpanelCreated = false;

        if (whmReady) {
          let whmResult: any;
          try {
            whmResult = await whmCall('createacct', {
              username: body.username,
              domain: body.domain,
              password: body.password,
              contactemail: body.email || '',
              quota: String(diskQuota),
              bwlimit: String(body.bandwidth_mb || 10000),
              plan: body.plan_name || 'default',
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('WHM createacct failed:', msg);
            return new Response(JSON.stringify({ error: `cPanel account creation failed: ${msg}` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          cpanelCreated = whmResult?.metadata?.result === 1;
          if (!cpanelCreated) {
            const reason = whmResult?.metadata?.reason || 'Unknown WHM error';
            return new Response(JSON.stringify({ error: `cPanel account creation failed: ${reason}` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        // Insert into reseller_accounts
        const { data: account, error: insertErr } = await supabaseClient
          .from('reseller_accounts')
          .insert({
            reseller_package_id: pkg.id,
            reseller_user_id: pkg.user_id,
            domain: body.domain,
            username: body.username,
            plan_name: body.plan_name || 'Basic',
            disk_quota_mb: diskQuota,
            bandwidth_mb: body.bandwidth_mb || 10000,
            email: body.email || null,
            cpanel_created: cpanelCreated,
            status: 'active',
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        // Update quota usage
        await supabaseClient
          .from('reseller_packages')
          .update({
            used_accounts: pkg.used_accounts + 1,
            used_disk_mb: pkg.used_disk_mb + diskQuota,
            used_bandwidth_mb: pkg.used_bandwidth_mb + (body.bandwidth_mb || 10000),
          })
          .eq('id', pkg.id);

        result = { success: true, account, cpanel_created: cpanelCreated };
        break;
      }

      case 'suspend_account': {
        if (!body.account_id) {
          return new Response(JSON.stringify({ error: 'account_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: acc } = await supabaseClient
          .from('reseller_accounts')
          .select('*')
          .eq('id', body.account_id)
          .eq('reseller_user_id', user.id)
          .single();

        if (!acc) {
          return new Response(JSON.stringify({ error: 'Account not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (acc.cpanel_created) {
          try { await whmCall('suspendacct', { user: acc.username }); } catch (e) { console.warn('WHM suspend failed:', e); }
        }

        await supabaseClient
          .from('reseller_accounts')
          .update({ status: 'suspended', suspended_at: new Date().toISOString() })
          .eq('id', body.account_id);

        result = { success: true, status: 'suspended' };
        break;
      }

      case 'unsuspend_account': {
        if (!body.account_id) {
          return new Response(JSON.stringify({ error: 'account_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: acc } = await supabaseClient
          .from('reseller_accounts')
          .select('*')
          .eq('id', body.account_id)
          .eq('reseller_user_id', user.id)
          .single();

        if (!acc) {
          return new Response(JSON.stringify({ error: 'Account not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (acc.cpanel_created) {
          try { await whmCall('unsuspendacct', { user: acc.username }); } catch (e) { console.warn('WHM unsuspend failed:', e); }
        }

        await supabaseClient
          .from('reseller_accounts')
          .update({ status: 'active', suspended_at: null })
          .eq('id', body.account_id);

        result = { success: true, status: 'active' };
        break;
      }

      case 'terminate_account': {
        if (!body.account_id) {
          return new Response(JSON.stringify({ error: 'account_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: acc } = await supabaseClient
          .from('reseller_accounts')
          .select('*')
          .eq('id', body.account_id)
          .eq('reseller_user_id', user.id)
          .single();

        if (!acc) {
          return new Response(JSON.stringify({ error: 'Account not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (acc.cpanel_created) {
          try { await whmCall('removeacct', { user: acc.username }); } catch (e) { console.warn('WHM terminate failed:', e); }
        }

        // Update quotas
        await supabaseClient
          .from('reseller_packages')
          .update({
            used_accounts: Math.max(0, pkg.used_accounts - 1),
            used_disk_mb: Math.max(0, pkg.used_disk_mb - acc.disk_quota_mb),
            used_bandwidth_mb: Math.max(0, pkg.used_bandwidth_mb - acc.bandwidth_mb),
          })
          .eq('id', pkg.id);

        await supabaseClient
          .from('reseller_accounts')
          .delete()
          .eq('id', body.account_id);

        result = { success: true, status: 'terminated' };
        break;
      }

      case 'list_accounts': {
        const { data: accounts } = await supabaseClient
          .from('reseller_accounts')
          .select('*')
          .eq('reseller_package_id', pkg.id)
          .order('created_at', { ascending: false });

        result = { success: true, accounts: accounts || [] };
        break;
      }

      case 'test_connection': {
        if (!pkg.whm_server_host || !pkg.whm_username) {
          result = { success: false, connected: false, error: 'WHM server host / username not set on this package' };
          break;
        }
        if (!WHM_API_TOKEN) {
          result = { success: false, connected: false, error: 'WHM API token is not configured' };
          break;
        }
        try {
          const v = await whmCall('version');
          result = { success: true, connected: true, server: pkg.whm_server_host, version: v?.data?.version || v?.version || 'unknown' };
        } catch (e) {
          result = { success: false, connected: false, error: e instanceof Error ? e.message : 'Connection failed' };
        }
        break;
      }

      case 'account_summary': {
        const { data: accounts } = await supabaseClient
          .from('reseller_accounts')
          .select('status')
          .eq('reseller_package_id', pkg.id);

        const active = (accounts || []).filter(a => a.status === 'active').length;
        const suspended = (accounts || []).filter(a => a.status === 'suspended').length;

        result = {
          success: true,
          summary: {
            total: accounts?.length || 0,
            active,
            suspended,
            quota: {
              accounts: { used: pkg.used_accounts, max: pkg.max_accounts },
              disk_mb: { used: pkg.used_disk_mb, max: pkg.max_disk_mb },
              bandwidth_mb: { used: pkg.used_bandwidth_mb, max: pkg.max_bandwidth_mb },
            }
          }
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('WHM manage error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
