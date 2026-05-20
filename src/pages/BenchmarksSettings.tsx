import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Lock, Save, Plus, Trash2, Sliders } from "lucide-react";
import { METRIC_KEYS, METRIC_LABELS, getDefaultBenchmark } from "@/lib/scorecard/benchmarks";

const STAGES = ["Pre-Seed", "Seed", "Series A"];
const SECTORS = [
  "default",
  "Aerospace & Defense",
  "AI Infrastructure",
  "Robotics",
  "Vertical AI SaaS",
  "Cybersecurity",
  "Supply Chain & Logistics",
  "Digital Health",
  "FinTech",
  "GovTech",
];

interface Row {
  id?: string;
  sector: string;
  stage: string;
  metric: string;
  target_value: number | null;
  weight: number;
  inverted: boolean;
  notes: string | null;
  dirty?: boolean;
}

export default function BenchmarksSettings() {
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sector, setSector] = useState("default");
  const [stage, setStage] = useState("Seed");
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scorecard_benchmarks")
      .select("*")
      .eq("sector", sector)
      .eq("stage", stage);
    if (error) {
      toast.error("Failed to load benchmarks: " + error.message);
      setLoading(false);
      return;
    }
    const byMetric = new Map<string, any>();
    (data ?? []).forEach((r) => byMetric.set(r.metric, r));
    const merged: Row[] = METRIC_KEYS.map((metric) => {
      const existing = byMetric.get(metric);
      if (existing) {
        return {
          id: existing.id,
          sector: existing.sector,
          stage: existing.stage,
          metric,
          target_value: existing.target_value,
          weight: Number(existing.weight ?? 0),
          inverted: !!existing.inverted,
          notes: existing.notes ?? "",
        };
      }
      const d = getDefaultBenchmark(stage, metric);
      return {
        sector,
        stage,
        metric,
        target_value: d.target_value,
        weight: d.weight,
        inverted: d.inverted,
        notes: "",
      };
    });
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => {
    if (!rolesLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector, stage, rolesLoading]);

  const weightTotal = useMemo(
    () => rows.reduce((acc, r) => acc + (Number(r.weight) || 0), 0),
    [rows]
  );

  const update = (metric: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.metric === metric ? { ...r, ...patch, dirty: true } : r)));
  };

  const onSave = async () => {
    if (!isAdmin) return;
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    setSaving(true);
    const payload = rows.map((r) => ({
      id: r.id,
      sector,
      stage,
      metric: r.metric,
      target_value: r.target_value,
      weight: r.weight,
      inverted: r.inverted,
      notes: r.notes ?? null,
      tier_thresholds: {},
      updated_by: userId,
    }));
    const { error } = await supabase
      .from("scorecard_benchmarks")
      .upsert(payload, { onConflict: "sector,stage,metric" });
    setSaving(false);
    if (error) toast.error("Save failed: " + error.message);
    else {
      toast.success("Benchmarks saved");
      load();
    }
  };

  const onReset = async () => {
    if (!isAdmin) return;
    if (!confirm(`Reset all ${sector} / ${stage} benchmarks to defaults? This deletes overrides.`)) return;
    const { error } = await supabase
      .from("scorecard_benchmarks")
      .delete()
      .eq("sector", sector)
      .eq("stage", stage);
    if (error) toast.error("Reset failed: " + error.message);
    else {
      toast.success("Reset to defaults");
      load();
    }
  };

  if (rolesLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Sliders className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Scorecard Benchmarks</h1>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Read-only — only admins can edit
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Target values, weights, and inversion flags drive quantitative scoring. Each (sector, stage, metric)
        row overrides the built-in defaults from the DCA workbook. Weights should sum to 1.00.
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Tabs value={stage} onValueChange={setStage}>
              <TabsList>
                {STAGES.map((s) => (<TabsTrigger key={s} value={s}>{s}</TabsTrigger>))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-xs ${Math.abs(weightTotal - 1) > 0.001 ? "text-destructive" : "text-muted-foreground"}`}>
              Weights total: {weightTotal.toFixed(2)}
            </div>
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={onReset} disabled={saving || loading}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Reset to defaults
                </Button>
                <Button size="sm" onClick={onSave} disabled={saving || loading}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Save
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading benchmarks…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="w-40">Target</TableHead>
                  <TableHead className="w-32">Weight</TableHead>
                  <TableHead className="w-32">Inverted</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.metric}>
                    <TableCell className="font-medium">
                      {METRIC_LABELS[r.metric] ?? r.metric}
                      <div className="text-xs text-muted-foreground font-mono">{r.metric}</div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="any"
                        disabled={!isAdmin}
                        value={r.target_value ?? ""}
                        onChange={(e) =>
                          update(r.metric, {
                            target_value: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        disabled={!isAdmin}
                        value={r.weight}
                        onChange={(e) => update(r.metric, { weight: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={r.inverted}
                        disabled={!isAdmin}
                        onCheckedChange={(v) => update(r.metric, { inverted: v })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        disabled={!isAdmin}
                        value={r.notes ?? ""}
                        placeholder="Optional context"
                        onChange={(e) => update(r.metric, { notes: e.target.value })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Plus className="h-3 w-3" /> Tip: set <em>Inverted</em> for metrics where lower is better (burn,
        customer concentration, EV/Revenue multiples).
      </p>
    </div>
  );
}
