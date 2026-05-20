import { useAgentActions, type AgentAction } from "@/hooks/agent/useAgentActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, RotateCw, AlertCircle } from "lucide-react";
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
  const { actions, loading, error, apply, reject, retry, refresh } = useAgentActions(status);
  const filtered = targetId
    ? actions.filter((a) => a.target_table === targetTable && a.target_id === targetId)
    : actions;

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
        Loading {status === "pending" ? "pending" : status} approvals…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-center py-8 space-y-3">
        <div className="text-destructive">Could not load approvals: {error}</div>
        <Button size="sm" variant="outline" onClick={refresh}>
          <RotateCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

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
        <ActionCard
          key={a.id}
          action={a}
          onApply={() => apply(a)}
          onReject={() => reject(a)}
          onRetry={() => retry(a)}
        />
      ))}
    </div>
  );
}

function ActionCard({
  action,
  onApply,
  onReject,
  onRetry,
}: {
  action: AgentAction;
  onApply: () => Promise<void>;
  onReject: () => Promise<void>;
  onRetry: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<"apply" | "reject" | "retry" | null>(null);

  const run = async (kind: "apply" | "reject" | "retry") => {
    setBusy(kind);
    try {
      if (kind === "apply") await onApply();
      else if (kind === "reject") await onReject();
      else await onRetry();
    } finally {
      setBusy(null);
    }
  };

  const isFailed = action.status === "failed";
  const isPending = action.status === "pending";

  return (
    <div className="border rounded-lg p-3 bg-card space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{ACTION_LABELS[action.action_type] ?? action.action_type}</Badge>
        {isFailed && <Badge variant="destructive">Failed</Badge>}
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(action.created_at).toLocaleString()}
        </span>
      </div>
      {action.rationale && (
        <p className="text-sm text-foreground">{action.rationale}</p>
      )}
      {isFailed && action.error && (
        <div className="flex gap-2 items-start text-xs bg-destructive/10 text-destructive rounded p-2">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          <span className="break-words">{action.error}</span>
        </div>
      )}
      <pre className="text-[11px] bg-muted p-2 rounded overflow-auto max-h-40">
        {JSON.stringify(action.payload, null, 2)}
      </pre>
      <div className="flex gap-2 justify-end">
        {isPending && (
          <>
            <Button size="sm" variant="ghost" onClick={() => run("reject")} disabled={busy !== null}>
              {busy === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
              Reject
            </Button>
            <Button size="sm" onClick={() => run("apply")} disabled={busy !== null}>
              {busy === "apply" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Apply
            </Button>
          </>
        )}
        {isFailed && (
          <Button size="sm" variant="secondary" onClick={() => run("retry")} disabled={busy !== null}>
            {busy === "retry" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3 mr-1" />}
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
