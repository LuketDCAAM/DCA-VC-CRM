import { useState } from "react";
import { AgentActionsPanel } from "@/components/agent/AgentActionsPanel";
import { useAgentActions } from "@/hooks/agent/useAgentActions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCheck, X, Loader2, Inbox } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Approvals() {
  const [tab, setTab] = useState<"pending" | "applied" | "rejected" | "failed">("pending");
  const { actions, apply, rejectMany } = useAgentActions(tab);
  const [bulk, setBulk] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const approveAll = async () => {
    setBulk(true);
    let ok = 0, fail = 0;
    for (const a of actions) {
      try { await apply(a); ok++; } catch { fail++; }
    }
    setBulk(false);
    toast({ title: `Approved ${ok}`, description: fail ? `${fail} failed` : undefined });
  };

  const rejectAll = async () => {
    setRejecting(true);
    await rejectMany(actions.map((a) => a.id));
    setRejecting(false);
    toast({ title: `Rejected ${actions.length}` });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Inbox className="h-6 w-6" /> Approvals
          </h1>
          <p className="text-sm text-muted-foreground">Review and apply changes proposed by the Assistant and Analyst agents.</p>
        </div>
        {tab === "pending" && actions.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={rejectAll} disabled={rejecting}>
              {rejecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
              Reject all ({actions.length})
            </Button>
            <Button onClick={approveAll} disabled={bulk}>
              {bulk ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCheck className="h-4 w-4 mr-2" />}
              Approve all ({actions.length})
            </Button>
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending {tab === "pending" && actions.length > 0 && <Badge variant="secondary" className="ml-2">{actions.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <AgentActionsPanel status={tab} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
