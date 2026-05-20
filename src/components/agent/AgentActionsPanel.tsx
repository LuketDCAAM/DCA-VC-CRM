import { useAgentActions, type AgentAction } from "@/hooks/agent/useAgentActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { useState } from "react";

const ACTION_LABELS: Record<string, string> = {
  update_deal: "Update deal",
  score_deal: "Score deal",
  create_deal: "Create deal",
  create_investor: "Create investor",
  update_investor: "Update investor",
  create_contact: "Create contact",
  update_contact: "Update contact",
  create_task: "Create task",
  draft_email: "Draft email",
};

export function AgentActionsPanel({
  targetTable,
  targetId,
  status = "pending",
}: {
  targetTable?: string;
  targetId?: string;
  status?: "pending" | "applied" | "rejected" | "failed" | "all";
}) {
  const { actions, apply, reject } = useAgentActions(status);
  const filtered = targetId
    ? actions.filter((a) => a.target_table === targetTable && a.target_id === targetId)
    : actions;

  if (filtered.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No {status === "pending" ? "pending" : status} agent suggestions.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((a) => (
        <ActionCard key={a.id} action={a} onApply={() => apply(a)} onReject={() => reject(a)} />
      ))}
    </div>
  );
}

function ActionCard({
  action,
  onApply,
  onReject,
}: {
  action: AgentAction;
  onApply: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<"apply" | "reject" | null>(null);

  const run = async (kind: "apply" | "reject") => {
    setBusy(kind);
    try {
      if (kind === "apply") await onApply();
      else await onReject();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-card space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{ACTION_LABELS[action.action_type] ?? action.action_type}</Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(action.created_at).toLocaleString()}
        </span>
      </div>
      {action.rationale && (
        <p className="text-sm text-foreground">{action.rationale}</p>
      )}
      <pre className="text-[11px] bg-muted p-2 rounded overflow-auto max-h-40">
        {JSON.stringify(action.payload, null, 2)}
      </pre>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => run("reject")} disabled={busy !== null}>
          {busy === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
          Reject
        </Button>
        <Button size="sm" onClick={() => run("apply")} disabled={busy !== null}>
          {busy === "apply" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          Apply
        </Button>
      </div>
    </div>
  );
}
