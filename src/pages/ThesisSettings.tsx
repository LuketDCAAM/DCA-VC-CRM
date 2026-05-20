import { useEffect, useState } from "react";
import { useInvestmentThesis } from "@/hooks/agent/useInvestmentThesis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

function ListInput({ label, value, onChange, placeholder = "Comma-separated" }: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  // Hold the raw string so the user can freely type commas, spaces, and trailing separators.
  const [raw, setRaw] = useState(value.join(", "));
  // Re-sync from parent only when the canonical array actually changes (e.g. after save/discard).
  useEffect(() => {
    const parsed = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parsed.join("|") !== value.join("|")) setRaw(value.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.join("|")]);
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={raw}
        placeholder={placeholder}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
      />
    </div>
  );
}

export default function ThesisSettings() {
  const { thesis, loading, save } = useInvestmentThesis();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);

  if (loading) {
    return <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading thesis…</div>;
  }
  if (!thesis) return <div className="p-8">No thesis row.</div>;

  const v = { ...thesis, ...(draft ?? {}) } as typeof thesis;
  const set = (patch: Partial<typeof thesis>) => setDraft({ ...(draft ?? {}), ...patch });

  const onSave = async () => {
    setSaving(true);
    const { error } = await save(draft ?? {});
    setSaving(false);
    if (error) toast.error("Save failed: " + (error as { message?: string }).message);
    else { toast.success("Thesis saved"); setDraft(null); }
  };

  const totalWeight = v.weight_sector_fit + v.weight_stage_fit + v.weight_traction + v.weight_team + v.weight_market;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Investment Thesis</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        The Analyst agent reads this when scoring inbound deals. Be specific — vague thesis = generic scoring.
      </p>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {listInput("Sectors", v.sectors, (x) => set({ sectors: x }), "fintech, AI, climate")}
          {listInput("Stages", v.stages, (x) => set({ stages: x }), "Pre-Seed, Seed, Series A")}
          {listInput("Geographies", v.geographies, (x) => set({ geographies: x }), "US, EU, LatAm")}
          {listInput("Business models", v.business_models, (x) => set({ business_models: x }), "B2B SaaS, marketplace")}
          <div className="space-y-1">
            <Label>Min check size (USD)</Label>
            <Input type="number" value={v.check_size_min ?? ""} onChange={(e) => set({ check_size_min: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="space-y-1">
            <Label>Max check size (USD)</Label>
            <Input type="number" value={v.check_size_max ?? ""} onChange={(e) => set({ check_size_max: e.target.value ? Number(e.target.value) : null })} />
          </div>
          {listInput("Must-haves", v.must_haves, (x) => set({ must_haves: x }), "technical founder, $10k MRR")}
          {listInput("Deal-breakers", v.deal_breakers, (x) => set({ deal_breakers: x }), "consulting, hardware-only")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scoring weights</CardTitle>
          <p className="text-xs text-muted-foreground">Sum should be 100. Currently: <span className={totalWeight === 100 ? "text-green-600" : "text-destructive"}>{totalWeight}</span></p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-4">
          {[
            ["weight_sector_fit", "Sector fit"],
            ["weight_stage_fit", "Stage fit"],
            ["weight_traction", "Traction"],
            ["weight_team", "Team"],
            ["weight_market", "Market"],
          ].map(([k, label]) => (
            <div key={k} className="space-y-1">
              <Label>{label}</Label>
              <Input type="number" min={0} max={100} value={v[k as keyof typeof v] as number}
                onChange={(e) => set({ [k]: Number(e.target.value) } as Partial<typeof thesis>)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Narrative</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={8} value={v.narrative ?? ""} onChange={(e) => set({ narrative: e.target.value })}
            placeholder="Free-form thesis — what wins, what loses, market view, anti-portfolio lessons, etc." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Notion call-transcripts database ID</Label>
            <Input value={v.notion_transcripts_db_id ?? ""} placeholder="32-char Notion DB id"
              onChange={(e) => set({ notion_transcripts_db_id: e.target.value || null })} />
            <p className="text-xs text-muted-foreground">
              Share that database with the Notion integration in your Notion settings, then paste the database ID here.
              Find it in the URL: notion.so/workspace/<b>DATABASE_ID</b>?v=…
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Auto-run on new deal</Label>
              <p className="text-xs text-muted-foreground">When a deal is added, run the Analyst automatically.</p>
            </div>
            <Switch checked={v.auto_run_on_create} onCheckedChange={(c) => set({ auto_run_on_create: c })} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button variant="outline" onClick={() => setDraft(null)} disabled={!draft || saving}>Discard</Button>
        <Button onClick={onSave} disabled={!draft || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save thesis
        </Button>
      </div>
    </div>
  );
}
