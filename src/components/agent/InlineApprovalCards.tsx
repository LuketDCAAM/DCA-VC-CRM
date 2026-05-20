import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, RotateCw, AlertCircle, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useActionsByIds } from "@/hooks/agent/useActionsByIds";
import { useAgentActions, type AgentAction } from "@/hooks/agent/useAgentActions";
import { cn } from "@/lib/utils";

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
  edit_prompt: "Edit agent instructions",
};

const STATUS_DOT: Record<AgentAction["status"], string> = {
  pending: "bg-amber-500",
  approved: "bg-blue-500",
  applied: "bg-emerald-500",
  rejected: "bg-muted-foreground",
  failed: "bg-destructive",
};

const STATUS_LABEL: Record<AgentAction["status"], string> = {
  pending: "Pending",
  approved: "Approving…",
  applied: "Applied",
  rejected: "Rejected",
  failed: "Failed",
};

export function InlineApprovalCards({ ids }: { ids: string[] }) {
  const { actions, loading } = useActionsByIds(ids);
  const { apply, reject, retry } = useAgentActions("pending");

  if (loading && actions.length === 0) {
    return (
      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Preparing proposals…
      </div>
    );
  }
  if (actions.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {actions.map((a) => (
        <InlineCard
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

function InlineCard({
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
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const isPending = action.status === "pending";
  const isFailed = action.status === "failed";
  const label = ACTION_LABELS[action.action_type] ?? action.action_type;

  // Collapsed one-line status for applied / rejected
  if (action.status === "applied" || action.status === "rejected") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground border-l-2 pl-3 py-1.5"
           style={{ borderColor: action.status === "applied" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[action.status])} />
        <span className="font-medium text-foreground">{STATUS_LABEL[action.status]}</span>
        <span>·</span>
        <span>{label}</span>
        {action.rationale && (
          <>
            <span className="text-muted-foreground/60">·</span>
            <span className="truncate">{action.rationale}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">{label}</span>
        <Badge variant="outline" className="h-5 text-[10px] gap-1.5 ml-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[action.status])} />
          {STATUS_LABEL[action.status]}
        </Badge>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {new Date(action.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="p-3 space-y-2">
        {action.rationale && (
          <p className="text-sm text-foreground">{action.rationale}</p>
        )}

        {isFailed && action.error && (
          <div className="flex gap-2 items-start text-xs bg-destructive/10 text-destructive rounded p-2">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="break-words">{action.error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {detailsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {detailsOpen ? "Hide details" : "Show details"}
        </button>
        {detailsOpen && (
          <pre className="text-[11px] bg-muted p-2 rounded overflow-auto max-h-48 whitespace-pre-wrap">
            {JSON.stringify(action.payload, null, 2)}
          </pre>
        )}

        <div className="flex gap-2 justify-end pt-1">
          {isPending && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => run("reject")}
                disabled={busy !== null}
                className="h-7"
              >
                {busy === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => run("apply")}
                disabled={busy !== null}
                className="h-7"
              >
                {busy === "apply" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                Approve
              </Button>
            </>
          )}
          {isFailed && (
            <Button size="sm" variant="secondary" onClick={() => run("retry")} disabled={busy !== null} className="h-7">
              {busy === "retry" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3 mr-1" />}
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
