import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAgentThreads } from "@/hooks/agent/useAgentThreads";
import { useAgentMessages } from "@/hooks/agent/useAgentMessages";
import { AgentChat } from "@/components/agent/AgentChat";
import { AgentActionsPanel } from "@/components/agent/AgentActionsPanel";
import { useAgentActions } from "@/hooks/agent/useAgentActions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  MessageSquare,
  Trash2,
  Inbox,
  PanelRightClose,
  PanelRightOpen,
  CheckCheck,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const SUGGESTIONS = [
  "Which deals haven't moved in 30 days?",
  "Summarize the latest call notes for our top priority deals",
  "Find investors for a seed-stage AI infrastructure deal",
  "Create a follow-up task for next Tuesday",
];

export default function Assistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { threadId } = useParams<{ threadId: string }>();
  const { threads, loading, createThread, deleteThread } = useAgentThreads();
  const { initialMessages, loading: messagesLoading } = useAgentMessages(threadId ?? null);
  const [creating, setCreating] = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [tab, setTab] = useState<"pending" | "applied" | "rejected" | "failed">("pending");
  const { actions, applyMany, rejectMany } = useAgentActions(tab);
  const [bulk, setBulk] = useState(false);
  const [bulkReject, setBulkReject] = useState(false);
  const [draft, setDraft] = useState("");

  const initialPrompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt;

  const goNew = () => navigate("/assistant");

  const handleNewBlank = async () => {
    goNew();
  };

  const startNewChat = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || creating) return;
    setCreating(true);
    const title = text.length > 60 ? `${text.slice(0, 57)}…` : text;
    const t = await createThread(title);
    setCreating(false);
    if (t) {
      setDraft("");
      navigate(`/assistant/${t.id}`, { state: { initialPrompt: text } });
    }
  };


  const approveAll = async () => {
    setBulk(true);
    const { ok, failed } = await applyMany(actions.map((a) => a.id));
    setBulk(false);
    toast({ title: `Approved ${ok}`, description: failed ? `${failed} failed` : undefined });
  };

  const rejectAll = async () => {
    setBulkReject(true);
    const { ok, failed } = await rejectMany(actions.map((a) => a.id));
    setBulkReject(false);
    toast({ title: `Rejected ${ok}`, description: failed ? `${failed} failed` : undefined });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col bg-muted/30">
        <div className="p-3 border-b">
          <Button onClick={handleNewBlank} className="w-full" size="sm" variant={!threadId ? "default" : "outline"}>
            <Plus className="h-4 w-4 mr-2" /> New chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {threads.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-muted",
                  threadId === t.id && "bg-muted font-medium",
                )}
                onClick={() => navigate(`/assistant/${t.id}`)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{t.title}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this conversation?")) {
                      deleteThread(t.id);
                      if (threadId === t.id) navigate("/assistant");
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {!loading && threads.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                No conversations yet.
              </p>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {!threadId ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  How can I help?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ask anything about your pipeline, portfolio, investors, or tasks.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startNewChat(draft);
                }}
                className="rounded-2xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring/40 transition"
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      startNewChat(draft);
                    }
                  }}
                  placeholder="Message the assistant…"
                  className="min-h-[64px] max-h-48 resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent px-4 py-3"
                  autoFocus
                />
                <div className="flex items-center justify-end px-2 pb-2">
                  <Button type="submit" size="icon" disabled={!draft.trim() || creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>

              <div className="grid sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => startNewChat(s)}
                    disabled={creating}
                    className="text-left text-sm rounded-lg border px-3 py-2 hover:bg-muted/50 transition disabled:opacity-60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : messagesLoading ? (
          <div className="text-center text-sm text-muted-foreground py-12">Loading...</div>
        ) : (
          <AgentChat
            key={threadId}
            threadId={threadId}
            initialMessages={initialMessages}
            initialPrompt={initialPrompt}
          />
        )}

        {!approvalsOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setApprovalsOpen(true)}
            className="absolute top-3 right-3 gap-2"
          >
            <PanelRightOpen className="h-4 w-4" />
            Approvals
            {tab === "pending" && actions.length > 0 && (
              <Badge variant="secondary">{actions.length}</Badge>
            )}
          </Button>
        )}
      </main>

      {/* Approvals side panel */}
      {approvalsOpen && (
        <aside className="w-96 border-l flex flex-col bg-background">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Approvals</h3>
              {tab === "pending" && actions.length > 0 && (
                <Badge variant="secondary">{actions.length}</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setApprovalsOpen(false)}>
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-3 mt-2 self-start">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="applied">Applied</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
            {tab === "pending" && actions.length > 0 && (
              <div className="px-3 pt-2 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={rejectAll} disabled={bulkReject || bulk}>
                  {bulkReject ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <X className="h-3 w-3 mr-2" />}
                  Reject all
                </Button>
                <Button size="sm" className="flex-1" onClick={approveAll} disabled={bulk || bulkReject}>
                  {bulk ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <CheckCheck className="h-3 w-3 mr-2" />}
                  Approve all ({actions.length})
                </Button>
              </div>
            )}
            <TabsContent value={tab} className="flex-1 overflow-auto p-3 mt-2">
              <AgentActionsPanel status={tab} />
            </TabsContent>
          </Tabs>
        </aside>
      )}
    </div>
  );
}
