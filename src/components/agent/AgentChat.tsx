import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, ChevronDown, ChevronRight, Wrench, StopCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineApprovalCards } from "@/components/agent/InlineApprovalCards";

interface AgentChatProps {
  threadId: string;
  initialMessages: UIMessage[];
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent`;

type ProviderId = "anthropic" | "openai" | "google";
type ConnectedProvider = { provider: ProviderId; default_model: string; is_default: boolean };

const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: "Claude",
  openai: "ChatGPT",
  google: "Gemini",
};

export function AgentChat({ threadId, initialMessages }: AgentChatProps) {
  const [input, setInput] = useState("");
  const [providers, setProviders] = useState<ConnectedProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | "default">("default");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("user_ai_credentials")
        .select("provider, default_model, is_default")
        .order("provider");
      if (cancelled) return;
      const rows = (data ?? []).filter(
        (r): r is ConnectedProvider =>
          r.provider === "anthropic" || r.provider === "openai" || r.provider === "google",
      );
      setProviders(rows);
    };
    load();
    const onChange = () => load();
    window.addEventListener("ai-creds-changed", onChange);
    return () => { cancelled = true; window.removeEventListener("ai-creds-changed", onChange); };
  }, []);

  const defaultProvider = providers.find((p) => p.is_default);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: FUNCTIONS_URL,
      fetch: async (url, options) => {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = new Headers(options?.headers);
        if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
        const bodyText = options?.body ? String(options.body) : "{}";
        const parsed = JSON.parse(bodyText);
        const providerOverride = selectedProvider === "default" ? undefined : selectedProvider;
        return fetch(url, {
          ...options,
          headers,
          body: JSON.stringify({ ...parsed, threadId, providerOverride }),
        });
      },
    }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "streaming" || status === "submitted") return;
    sendMessage({ text: input });
    setInput("");
  };

  const isBusy = status === "streaming" || status === "submitted";


  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-12">
              Ask anything about your pipeline. Try:
              <ul className="mt-3 space-y-1 text-left max-w-md mx-auto list-disc list-inside">
                <li>"Which deals haven't moved in 30 days?"</li>
                <li>"Summarize call notes for [company]"</li>
                <li>"Find investors for a seed AI deal"</li>
                <li>"Create a follow-up task for [company] next Tuesday"</li>
              </ul>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive">Error: {error.message}</div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={onSubmit} className="border-t p-3 bg-background">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Model:</span>
            <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as ProviderId | "default")}>
              <SelectTrigger className="h-7 w-auto min-w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  {defaultProvider
                    ? `Default (${PROVIDER_LABELS[defaultProvider.provider]} · ${defaultProvider.default_model})`
                    : "Default (Lovable AI)"}
                </SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p.provider} value={p.provider}>
                    {PROVIDER_LABELS[p.provider]} · {p.default_model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {providers.length === 0 && (
              <a href="/settings/integrations" className="underline ml-auto">Connect your own keys</a>
            )}
          </div>
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              placeholder="Ask the assistant..."
              className="min-h-[52px] max-h-32 resize-none"
              autoFocus
            />
            {isBusy ? (
              <Button type="button" size="icon" variant="secondary" onClick={() => stop()}>
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>

    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      <div
        className={cn(
          isUser
            ? "rounded-lg px-4 py-2 max-w-[85%] bg-primary text-primary-foreground"
            : "max-w-[85%] w-full space-y-1",
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className={cn("prose prose-sm dark:prose-invert max-w-none", !isUser && "text-foreground")}>
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }
          if (part.type.startsWith("tool-")) {
            const tp = part as ToolPartShape;
            const ids = extractActionIds(tp);
            return (
              <div key={i}>
                <ToolPart part={tp} />
                {ids.length > 0 && <InlineApprovalCards ids={ids} />}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function extractActionIds(part: ToolPartShape): string[] {
  const out = part.output as Record<string, unknown> | undefined;
  if (!out || typeof out !== "object") return [];
  const ids: string[] = [];
  if (typeof out.action_id === "string") ids.push(out.action_id);
  if (Array.isArray(out.action_ids)) {
    for (const v of out.action_ids) if (typeof v === "string") ids.push(v);
  }
  return ids;
}

interface ToolPartShape {
  type: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

function ToolPart({ part }: { part: ToolPartShape }) {
  const [open, setOpen] = useState(false);
  const name = part.toolName ?? part.type.replace(/^tool-/, "");
  const isProposal = name.startsWith("propose_");
  return (
    <div className="my-2 border rounded-md bg-background/50 text-foreground text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Wrench className="h-3 w-3" />
        <span className="font-mono">{name}</span>
        <span className="ml-auto text-muted-foreground">{part.state}</span>
        {isProposal && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium">
            proposal
          </span>
        )}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {part.input !== undefined && (
            <div>
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Input</div>
              <pre className="bg-muted p-2 rounded overflow-auto text-[11px]">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {part.output !== undefined && (
            <div>
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Output</div>
              <pre className="bg-muted p-2 rounded overflow-auto text-[11px] max-h-64">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            </div>
          )}
          {part.errorText && (
            <div className="text-destructive">{part.errorText}</div>
          )}
        </div>
      )}
    </div>
  );
}
