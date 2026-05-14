import { useAnalystRuns } from "@/hooks/agent/useAnalystRuns";
import { useAgentActions } from "@/hooks/agent/useAgentActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Play, ExternalLink, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AnalystPanelProps {
  dealId: string;
}

export function AnalystPanel({ dealId }: AnalystPanelProps) {
  const { latest, runs, running, runAnalyst } = useAnalystRuns(dealId);
  const { actions, apply, reject } = useAgentActions("pending");

  // Filter actions tied to this deal
  const dealActions = actions.filter((a) => a.target_id === dealId || (a.payload as { deal_id?: string })?.deal_id === dealId);

  const onRun = async () => {
    const r = await runAnalyst("manual");
    if (r.error) toast.error(r.error);
    else toast.success("Analyst run complete");
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> Analyst
          {latest?.score != null && <Badge variant="secondary">Score {latest.score}/100</Badge>}
        </CardTitle>
        <Button size="sm" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {latest ? "Re-run" : "Run Analyst"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!latest && !running && (
          <p className="text-sm text-muted-foreground">No analysis yet. Click <b>Run Analyst</b> to score this deal vs your thesis.</p>
        )}
        {running && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Researching, scoring, drafting next steps…
          </div>
        )}
        {latest && (
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{latest.trigger}</Badge>
              <span>{formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}</span>
              {latest.status === "failed" && <Badge variant="destructive">failed</Badge>}
            </div>

            {latest.summary && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.summary}</ReactMarkdown>
              </div>
            )}

            {latest.sources && latest.sources.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Sources</p>
                <ul className="text-xs space-y-1">
                  {latest.sources.map((s, i) => (
                    <li key={i}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        {s.title || s.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dealActions.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground">Pending proposals ({dealActions.length})</p>
                {dealActions.map((a) => (
                  <div key={a.id} className="rounded border p-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{a.action_type}</Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => apply(a)}>
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => reject(a)}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {a.rationale && <p className="text-xs text-muted-foreground mt-1">{a.rationale}</p>}
                  </div>
                ))}
              </div>
            )}

            {runs.length > 1 && (
              <p className="text-xs text-muted-foreground">{runs.length} total runs on this deal</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
