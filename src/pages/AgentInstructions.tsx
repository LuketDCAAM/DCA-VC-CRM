import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, History, Save } from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Prompt {
  id: string;
  slug: string;
  kind: "prompt" | "playbook";
  title: string;
  body: string;
  sort_order: number;
  updated_at: string;
}

interface Version {
  id: string;
  body: string;
  change_note: string | null;
  created_at: string;
}

export default function AgentInstructions() {
  const { isAdmin } = useUserRoles();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agent_prompts")
      .select("id,slug,kind,title,body,sort_order,updated_at")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setPrompts((data ?? []) as Prompt[]);
    if (!activeId && data?.length) setActiveId(data[0].id);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const active = prompts.find((p) => p.id === activeId) ?? null;

  useEffect(() => {
    setDraft(active?.body ?? "");
  }, [active?.id, active?.body]);

  const dirty = active != null && draft !== active.body;

  const save = async () => {
    if (!active) return;
    setSaving(true);
    // Snapshot previous body to version history
    const { error: histErr } = await supabase.from("agent_prompt_versions").insert({
      prompt_id: active.id,
      slug: active.slug,
      body: active.body,
      change_note: "Manual edit from admin UI",
    });
    if (histErr) {
      toast.error(histErr.message);
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("agent_prompts")
      .update({ body: draft })
      .eq("id", active.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    await load();
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-muted-foreground">
        Admin role required to edit agent instructions.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const promptList = prompts.filter((p) => p.kind === "prompt");
  const playbookList = prompts.filter((p) => p.kind === "playbook");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Agent Instructions</h1>
        <p className="text-sm text-muted-foreground">
          Edit the markdown the AI assistant uses. Changes take effect on the next chat turn (~30s cache).
        </p>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-4">
          <Section title="Prompts" items={promptList} activeId={activeId} onSelect={setActiveId} />
          <Section title="Playbooks" items={playbookList} activeId={activeId} onSelect={setActiveId} />
        </aside>

        <main>
          {active ? (
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-base">{active.title}</CardTitle>
                  <div className="text-xs text-muted-foreground font-mono mt-1">{active.slug}</div>
                </div>
                <Badge variant="outline">{active.kind}</Badge>
                <HistoryButton promptId={active.id} onRestore={(body) => { setDraft(body); }} />
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="font-mono text-sm min-h-[500px]"
                />
                <div className="flex items-center gap-3">
                  <Button onClick={save} disabled={!dirty || saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                  {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
                  <span className="text-xs text-muted-foreground ml-auto">
                    Last updated {new Date(active.updated_at).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-muted-foreground">Select a prompt on the left.</div>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  activeId,
  onSelect,
}: {
  title: string;
  items: Prompt[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 px-2">{title}</div>
      <div className="space-y-1">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
              activeId === p.id ? "bg-muted font-medium" : ""
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryButton({ promptId, onRestore }: { promptId: string; onRestore: (body: string) => void }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("agent_prompt_versions")
      .select("id,body,change_note,created_at")
      .eq("prompt_id", promptId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setVersions((data ?? []) as Version[]));
  }, [open, promptId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4 mr-1" /> History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {versions.length === 0 && <div className="text-sm text-muted-foreground">No prior versions.</div>}
          {versions.map((v) => (
            <div key={v.id} className="border rounded p-2 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(v.created_at).toLocaleString()}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto h-6 px-2 text-xs"
                  onClick={() => { onRestore(v.body); setOpen(false); }}
                >
                  Load into editor
                </Button>
              </div>
              {v.change_note && <div className="text-xs italic">{v.change_note}</div>}
              <pre className="text-[11px] bg-muted p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                {v.body}
              </pre>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
