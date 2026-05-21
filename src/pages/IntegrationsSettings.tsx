import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

type NotionConn = {
  id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
  created_at: string;
  last_synced_at: string | null;
};

export default function IntegrationsSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [conn, setConn] = useState<NotionConn | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_notion_connections')
      .select('id, workspace_name, workspace_icon, created_at, last_synced_at')
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      toast({ title: 'Failed to load Notion connection', description: error.message, variant: 'destructive' });
    }
    setConn((data as NotionConn) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // After OAuth redirect back
    const url = new URL(window.location.href);
    if (url.searchParams.get('notion') === 'success') {
      toast({ title: 'Notion connected', description: 'Your Notion workspace is now linked.' });
      url.searchParams.delete('notion');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const returnTo = `${window.location.origin}/settings/integrations?notion=success`;
      const { data, error } = await supabase.functions.invoke('notion-oauth-start', {
        body: { return_to: returnTo },
      });
      if (error || !data?.auth_url) throw new Error(error?.message || 'Failed to start OAuth');
      window.location.href = data.auth_url;
    } catch (e) {
      toast({ title: 'Could not start Notion connection', description: (e as Error).message, variant: 'destructive' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!conn) return;
    const { error } = await supabase.from('user_notion_connections').delete().eq('id', conn.id);
    if (error) {
      toast({ title: 'Failed to disconnect', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Notion disconnected' });
    setConn(null);
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground">Connect external tools to your account.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Notion
                {conn && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </CardTitle>
              <CardDescription>
                Connect your Notion workspace to automatically import call notes and transcripts into deals.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : conn ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                {conn.workspace_icon && (
                  <img src={conn.workspace_icon} alt="" className="h-8 w-8 rounded" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{conn.workspace_name || 'Notion workspace'}</div>
                  <div className="text-xs text-muted-foreground">
                    Connected {new Date(conn.created_at).toLocaleDateString()}
                    {conn.last_synced_at && ` • Last sync ${new Date(conn.last_synced_at).toLocaleString()}`}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4 text-sm space-y-2">
                <div className="font-medium">Next: pick what to sync</div>
                <p className="text-muted-foreground">
                  In the next step you'll choose which Notion database or pages hold your call notes and map their
                  columns. (Coming in the next phase.)
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleConnect} disabled={connecting}>
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reconnect
                </Button>
                <Button variant="destructive" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              <ol className="text-sm space-y-2 list-decimal pl-5 text-muted-foreground">
                <li>Click <strong>Connect Notion</strong> below — you'll be redirected to Notion.</li>
                <li>Sign in to Notion and select the workspace you want to connect.</li>
                <li>Choose which pages and databases (your call notes) to share with this app.</li>
                <li>You'll be sent back here automatically once connected.</li>
              </ol>
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecting…</>
                ) : (
                  <>Connect Notion <ExternalLink className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
