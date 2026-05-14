import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAgentThreads } from "@/hooks/agent/useAgentThreads";
import { useAgentMessages } from "@/hooks/agent/useAgentMessages";
import { AgentChat } from "@/components/agent/AgentChat";
import { AgentActionsPanel } from "@/components/agent/AgentActionsPanel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Assistant() {
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId: string }>();
  const { threads, loading, createThread, deleteThread } = useAgentThreads();
  const { initialMessages, loading: messagesLoading } = useAgentMessages(threadId ?? null);
  const [creating, setCreating] = useState(false);

  // Auto-select most recent thread or create one
  useEffect(() => {
    if (loading) return;
    if (threadId) return;
    if (threads.length > 0) {
      navigate(`/assistant/${threads[0].id}`, { replace: true });
    }
  }, [loading, threads, threadId, navigate]);

  const handleNew = async () => {
    setCreating(true);
    const t = await createThread();
    setCreating(false);
    if (t) navigate(`/assistant/${t.id}`);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col bg-muted/30">
        <div className="p-3 border-b">
          <Button onClick={handleNew} disabled={creating} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" /> New conversation
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

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {!threadId ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold mb-2">CRM Assistant</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Start a conversation to query, analyze, and act on your pipeline.
              </p>
              <Button onClick={handleNew} disabled={creating}>
                <Plus className="h-4 w-4 mr-2" /> New conversation
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-3 self-start">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="actions">Pending actions</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 mt-0">
              {messagesLoading ? (
                <div className="text-center text-sm text-muted-foreground py-12">Loading...</div>
              ) : (
                <AgentChat key={threadId} threadId={threadId} initialMessages={initialMessages} />
              )}
            </TabsContent>
            <TabsContent value="actions" className="flex-1 overflow-auto p-4">
              <AgentActionsPanel />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
