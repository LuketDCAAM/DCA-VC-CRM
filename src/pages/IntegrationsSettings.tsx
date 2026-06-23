import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';

type NotionConn = {
  id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
  created_at: string;
  last_synced_at: string | null;
};

type AICred = {
  provider: string;
  last_4: string;
  default_model: string;
  last_used_at: string | null;
  last_status: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

// Fallback model list used before the user connects a key, or if Anthropic's
// Models API is unreachable. Kept in rough "most current first" order so the
// recommended default stays at the top. Once a key is connected we replace this
// with the live list from Anthropic's /v1/models endpoint, so new releases
// (Opus 4.9, Sonnet 5, Haiku 5, etc.) appear automatically.
type ClaudeModel = { value: string; label: string };
const FALLBACK_models: ClaudeModel[] = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (recommended — best speed/quality)' },
  { value: 'claude-opus-4-8', label: 'Claude Opus 4.8 (most capable)' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest / cheapest)' },
  { value: 'claude-fable-5', label: 'Claude Fable 5 (frontier reasoning)' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
];
const DEFAULT_MODEL = FALLBACK_models[0].value;


export default function IntegrationsSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [conn, setConn] = useState<NotionConn | null>(null);

  // --- Claude / Anthropic BYOK ---
  const [aiLoading, setAiLoading] = useState(true);
  const [aiCred, setAiCred] = useState<AICred | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState<ClaudeModel[]>(FALLBACK_models);
  const [refreshingModels, setRefreshingModels] = useState(false);

  const refreshModels = async (candidateKey?: string) => {
    setRefreshingModels(true);
    try {
      const { data } = await supabase.functions.invoke('user-ai-credentials?action=list-models', {
        method: 'POST',
        body: { api_key: candidateKey?.trim() || undefined },
      });
      const live = (data?.models as Array<{ id: string; label: string }> | undefined) ?? [];
      if (live.length > 0) {
        setModels(live.map((m) => ({ value: m.id, label: m.label })));
      }
    } finally {
      setRefreshingModels(false);
    }
  };


  const loadAiCred = async () => {
    setAiLoading(true);
    const { data, error } = await supabase.functions.invoke('user-ai-credentials', { method: 'GET' });
    if (error) {
      // Silently ignore — likely just not connected.
    }
    const c = (data?.credential as AICred | null) ?? null;
    setAiCred(c);
    if (c?.default_model) setModel(c.default_model);
    setAiLoading(false);
  };

  const handleSaveAi = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Enter your Anthropic API key', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('user-ai-credentials', {
      method: 'POST',
      body: { api_key: apiKey.trim(), default_model: model },
    });
    setSaving(false);
    if (error || data?.error) {
      toast({
        title: 'Could not connect Claude',
        description: data?.error ?? error?.message ?? 'Unknown error',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Claude connected', description: `Key ending in ${data.last_4} verified.` });
    setApiKey('');
    await loadAiCred();
  };


  const handleDisconnectAi = async () => {
    const { error } = await supabase.functions.invoke('user-ai-credentials', { method: 'DELETE' });
    if (error) {
      toast({ title: 'Failed to disconnect', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Claude disconnected', description: 'AI calls will fall back to shared credits.' });
    setAiCred(null);
    setModel(DEFAULT_MODEL);
  };

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
    loadAiCred();
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
      // Notion blocks being loaded inside an iframe (e.g. the Lovable preview).
      // Break out to the top window if possible, otherwise open in a new tab.
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = data.auth_url;
        } else {
          window.location.href = data.auth_url;
        }
      } catch {
        window.open(data.auth_url, '_blank', 'noopener,noreferrer');
      }
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

      {/* Claude / Anthropic BYOK */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Claude (Anthropic)
                {aiCred && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </CardTitle>
              <CardDescription>
                Run every AI feature in this app — the assistant, scorecard fills, analyst runs — on your own
                Anthropic account. Usage is billed directly to your Claude account, not to shared credits.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : aiCred ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    Key ending in <code className="px-1.5 py-0.5 rounded bg-muted text-xs">…{aiCred.last_4}</code>
                    {aiCred.last_status === 'ok' && <Badge variant="secondary">Healthy</Badge>}
                    {aiCred.last_status === 'error' && <Badge variant="destructive">Error</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Model: {aiCred.default_model} · Connected {new Date(aiCred.created_at).toLocaleDateString()}
                    {aiCred.last_used_at && ` · Last used ${new Date(aiCred.last_used_at).toLocaleString()}`}
                  </div>
                  {aiCred.last_error && (
                    <div className="mt-2 text-xs text-destructive flex items-start gap-1">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{aiCred.last_error}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border p-4 space-y-3">
                <div className="text-sm font-medium">Update key or model</div>
                <div className="space-y-2">
                  <Label htmlFor="ai-model">Default model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="ai-model"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-key">New API key (optional — leave blank to keep current)</Label>
                  <Input
                    id="ai-key"
                    type="password"
                    placeholder="sk-ant-…"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleSaveAi} disabled={saving || !apiKey.trim()}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save & verify
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnectAi} disabled={saving}>
                    Disconnect
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  To change only the model, re-paste your key with the new model selected.
                </p>
              </div>
            </>
          ) : (
            <>
              <ol className="text-sm space-y-2 list-decimal pl-5 text-muted-foreground">
                <li>
                  Go to{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    console.anthropic.com → API keys <ExternalLink className="inline h-3 w-3" />
                  </a>
                  {' '}and create a new key.
                </li>
                <li>Copy the key (starts with <code>sk-ant-</code>) and paste it below.</li>
                <li>We'll send one tiny verification request to Anthropic, then store the key encrypted.</li>
                <li>From then on every AI call in the app uses your account.</li>
              </ol>

              <div className="space-y-3 rounded-md border p-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-key-new">Anthropic API key</Label>
                  <Input
                    id="ai-key-new"
                    type="password"
                    placeholder="sk-ant-…"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-model-new">Default model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="ai-model-new"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveAi} disabled={saving || !apiKey.trim()}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</>
                  ) : (
                    <>Connect Claude</>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
