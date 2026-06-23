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

type Provider = 'anthropic' | 'openai' | 'google';

type AICred = {
  provider: Provider | string;
  last_4: string;
  default_model: string;
  last_used_at: string | null;
  last_status: string | null;
  last_error: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};


type ModelOpt = { value: string; label: string };

type ProviderConfig = {
  id: Provider;
  title: string;
  description: string;
  keyPlaceholder: string;
  keyHelp: string; // hint about what keys look like
  consoleUrl: string;
  keysUrl: string;
  billingUrl: string;
  steps: { text: string; href?: string; hrefLabel?: string }[];
  fallbackModels: ModelOpt[];
};

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    title: 'Claude (Anthropic)',
    description: 'Run AI features on your own Anthropic account — billed directly to your Claude API balance.',
    keyPlaceholder: 'sk-ant-…',
    keyHelp: 'Anthropic keys start with sk-ant-.',
    consoleUrl: 'https://console.anthropic.com/',
    keysUrl: 'https://console.anthropic.com/settings/keys',
    billingUrl: 'https://console.anthropic.com/settings/billing',
    steps: [
      { text: 'Sign in to the Anthropic Console. Verify your email and phone number if this is a new account.', href: 'https://console.anthropic.com/', hrefLabel: 'Anthropic Console' },
      { text: 'Add a payment method and load a small amount of credit.', href: 'https://console.anthropic.com/settings/billing', hrefLabel: 'Settings → Billing' },
      { text: 'Create a new API key, name it (e.g. "DCA VC CRM"), and copy the sk-ant-… value.', href: 'https://console.anthropic.com/settings/keys', hrefLabel: 'Settings → API keys' },
      { text: 'Paste it below and pick a default model. We send one tiny verification request, then store the key encrypted.' },
    ],
    fallbackModels: [
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (recommended)' },
      { value: 'claude-opus-4-8', label: 'Claude Opus 4.8 (most capable)' },
      { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest / cheapest)' },
      { value: 'claude-fable-5', label: 'Claude Fable 5 (frontier reasoning)' },
    ],
  },
  {
    id: 'openai',
    title: 'ChatGPT (OpenAI)',
    description: 'Use your own OpenAI account for every AI call. Usage shows up on your OpenAI bill.',
    keyPlaceholder: 'sk-…',
    keyHelp: 'OpenAI keys start with sk- (project keys: sk-proj-…).',
    consoleUrl: 'https://platform.openai.com/',
    keysUrl: 'https://platform.openai.com/api-keys',
    billingUrl: 'https://platform.openai.com/settings/organization/billing/overview',
    steps: [
      { text: 'Sign in to the OpenAI Platform. New accounts need email + phone verification.', href: 'https://platform.openai.com/', hrefLabel: 'OpenAI Platform' },
      { text: 'Add a payment method and pre-pay at least a few dollars of credit (OpenAI no longer extends free credit to most accounts).', href: 'https://platform.openai.com/settings/organization/billing/overview', hrefLabel: 'Billing' },
      { text: 'Create a new secret key (a Project key is preferred). Copy the sk-… value — OpenAI only shows it once.', href: 'https://platform.openai.com/api-keys', hrefLabel: 'API keys' },
      { text: 'Paste the key below and pick a default model. We send one tiny verification request, then store the key encrypted.' },
    ],
    fallbackModels: [
      { value: 'gpt-5-mini', label: 'GPT-5 mini (recommended — balanced)' },
      { value: 'gpt-5', label: 'GPT-5 (most capable)' },
      { value: 'gpt-5-nano', label: 'GPT-5 nano (fastest / cheapest)' },
      { value: 'gpt-4.1', label: 'GPT-4.1' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
    ],
  },
  {
    id: 'google',
    title: 'Gemini (Google AI)',
    description: 'Use your own Google AI Studio key. Usage is billed to your Google Cloud project (free tier available).',
    keyPlaceholder: 'AIza…',
    keyHelp: 'Google AI Studio keys typically start with AIza.',
    consoleUrl: 'https://aistudio.google.com/',
    keysUrl: 'https://aistudio.google.com/apikey',
    billingUrl: 'https://aistudio.google.com/apikey',
    steps: [
      { text: 'Sign in to Google AI Studio with your Google account.', href: 'https://aistudio.google.com/', hrefLabel: 'Google AI Studio' },
      { text: 'Open the API keys page and click "Create API key". You can create one inside an existing Google Cloud project, or let Google create a new one for you.', href: 'https://aistudio.google.com/apikey', hrefLabel: 'API keys' },
      { text: 'The free tier covers most light usage. For higher rate limits, enable billing on the linked Cloud project — Gemini will then bill that project for usage above the free quota.' },
      { text: 'Copy the AIza… key, paste it below, and pick a default model. We send one tiny verification request, then store the key encrypted.' },
    ],
    fallbackModels: [
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (recommended — balanced)' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (most capable)' },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (cheapest)' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
  },
];

type NotionConn = {
  id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
  created_at: string;
  last_synced_at: string | null;
};

function AIProviderCard({ config }: { config: ProviderConfig }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cred, setCred] = useState<AICred | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(config.fallbackModels[0].value);
  const [models, setModels] = useState<ModelOpt[]>(config.fallbackModels);
  const [saving, setSaving] = useState(false);
  const [refreshingModels, setRefreshingModels] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke(
      `user-ai-credentials?provider=${config.id}`,
      { method: 'GET' },
    );
    const c = (data?.credential as AICred | null) ?? null;
    setCred(c);
    if (c?.default_model) setModel(c.default_model);
    setLoading(false);
    if (c) refreshModels();
  };

  const refreshModels = async (candidateKey?: string) => {
    setRefreshingModels(true);
    try {
      const { data } = await supabase.functions.invoke(
        'user-ai-credentials?action=list-models',
        {
          method: 'POST',
          body: { provider: config.id, api_key: candidateKey?.trim() || undefined },
        },
      );
      const live = (data?.models as Array<{ id: string; label: string }> | undefined) ?? [];
      if (live.length > 0) {
        setModels(live.map((m) => ({ value: m.id, label: m.label })));
      }
    } finally {
      setRefreshingModels(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Enter your API key', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('user-ai-credentials', {
      method: 'POST',
      body: { provider: config.id, api_key: apiKey.trim(), default_model: model },
    });
    setSaving(false);
    if (error || data?.error) {
      toast({
        title: `Could not connect ${config.title}`,
        description: data?.error ?? error?.message ?? 'Unknown error',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: `${config.title} connected`, description: `Key ending in ${data.last_4} verified.` });
    setApiKey('');
    await load();
  };

  const handleDisconnect = async () => {
    const { error } = await supabase.functions.invoke(
      `user-ai-credentials?provider=${config.id}`,
      { method: 'DELETE' },
    );
    if (error) {
      toast({ title: 'Failed to disconnect', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `${config.title} disconnected` });
    setCred(null);
    setApiKey('');
    setModel(config.fallbackModels[0].value);
    setModels(config.fallbackModels);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {config.title}
          {cred && <CheckCircle2 className="h-5 w-5 text-green-600" />}
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : cred ? (
          <>
            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2 flex-wrap">
                  Key ending in <code className="px-1.5 py-0.5 rounded bg-muted text-xs">…{cred.last_4}</code>
                  {cred.last_status === 'ok' && <Badge variant="secondary">Healthy</Badge>}
                  {cred.last_status === 'error' && <Badge variant="destructive">Error</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  Model: {cred.default_model} · Connected {new Date(cred.created_at).toLocaleDateString()}
                  {cred.last_used_at && ` · Last used ${new Date(cred.last_used_at).toLocaleString()}`}
                </div>
                {cred.last_error && (
                  <div className="mt-2 text-xs text-destructive flex items-start gap-1">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{cred.last_error}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="text-sm font-medium">Update key or model</div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Default model
                  {refreshingModels && <Loader2 className="h-3 w-3 animate-spin" />}
                </Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>New API key (optional — leave blank to keep current)</Label>
                <Input
                  type="password"
                  placeholder={config.keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save & verify
                </Button>
                <Button variant="destructive" onClick={handleDisconnect} disabled={saving}>
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
            <div className="rounded-md border bg-muted/30 p-4 text-sm space-y-2">
              <div className="font-medium">How to connect</div>
              <ol className="space-y-2 list-decimal pl-5 text-muted-foreground">
                {config.steps.map((s, i) => (
                  <li key={i}>
                    {s.href && s.hrefLabel ? (
                      <>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline inline-flex items-center gap-1"
                        >
                          {s.hrefLabel} <ExternalLink className="h-3 w-3" />
                        </a>
                        {' — '}{s.text}
                      </>
                    ) : s.text}
                  </li>
                ))}
                <li>From then on every AI feature in the app — assistant, scorecard fills, analyst runs, deal scoring — runs on your account. Disconnect any time to fall back to shared credits.</li>
              </ol>
              <p className="text-xs text-muted-foreground pt-1">
                Tip: most providers let you set a monthly spend limit on the key so usage can't run away.
              </p>
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <div className="space-y-2">
                <Label>API key</Label>
                <Input
                  type="password"
                  placeholder={config.keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onBlur={() => apiKey.trim().length > 10 && refreshModels(apiKey)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">{config.keyHelp} Tab out and we'll fetch the live list of models your account has access to.</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Default model
                  {refreshingModels && <Loader2 className="h-3 w-3 animate-spin" />}
                </Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</>
                ) : (
                  <>Connect {config.title}</>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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
        <p className="text-muted-foreground">Connect external tools and your own AI accounts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Notion
            {conn && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </CardTitle>
          <CardDescription>
            Connect your Notion workspace to automatically import call notes and transcripts into deals.
          </CardDescription>
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleConnect} disabled={connecting}>
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reconnect
                </Button>
                <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
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

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Bring your own AI</h2>
        <p className="text-sm text-muted-foreground">
          Connect any (or all) of these providers to run AI features on your own account. If you connect more than one, the most recently saved key is used. Disconnect any to fall back to shared credits.
        </p>
      </div>

      {PROVIDERS.map((p) => <AIProviderCard key={p.id} config={p} />)}
    </div>
  );
}
