import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, FileSpreadsheet, Sparkles, FileDown, Wand2 } from "lucide-react";
import { useDealScorecard, inputsFromRow, type DealScorecardRow } from "@/hooks/useDealScorecard";
import { computeSnapshot } from "@/lib/scorecard/engine";
import type { QualitativeRating, QualitativeRatings, ScorecardInputs } from "@/lib/scorecard/types";
import { UploadsPanel } from "./UploadsPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportMemoPdf } from "@/lib/scorecard/memoExport";

interface Props {
  dealId: string;
}

const QUAL_CATEGORIES: { key: keyof QualitativeRatings; label: string; rubric: string }[] = [
  { key: "market", label: "Market Opportunity & Competitive Position",
    rubric: "5 = Large, growing TAM ($1B+); clear category leader. 3 = Moderate TAM, competitive but defensible. 1 = Small/declining market, no moat." },
  { key: "product", label: "Product & Technology",
    rubric: "5 = Strong PMF with measurable adoption; clear technical moat. 3 = Functional product, decent adoption. 1 = No PMF, weak tech." },
  { key: "business_model", label: "Business Model & GTM",
    rubric: "5 = Repeatable model, LTV/CAC > 3x, proven channels. 3 = Some channel proof. 1 = Unclear monetization." },
  { key: "team", label: "Team & Execution Capability",
    rubric: "5 = Experienced founders, prior exits, deep domain. 3 = Capable team, some gaps. 1 = First-time, missing key roles." },
  { key: "exit", label: "Exit & Return Potential",
    rubric: "5 = Multiple exit paths, IPO-scale trajectory. 3 = Plausible strategic exit. 1 = No clear path to >5x." },
];

const NARRATIVE_FIELDS: { key: keyof DealScorecardRow; label: string; placeholder: string }[] = [
  { key: "company_overview", label: "Company Overview", placeholder: "What does the company do?" },
  { key: "investment_thesis", label: "Investment Thesis", placeholder: "Why is this compelling?" },
  { key: "traction_milestones", label: "Traction & Milestones", placeholder: "Customers, revenue, partnerships." },
  { key: "business_model", label: "Business Model", placeholder: "How do they make money?" },
  { key: "key_strengths", label: "Key Strengths", placeholder: "Top 2-3 unfair advantages." },
  { key: "key_risks", label: "Key Risks & Concerns", placeholder: "Top 2-3 risks." },
  { key: "investor_base", label: "Investor Base", placeholder: "Current and committed investors." },
  { key: "competitive_landscape", label: "Competitive Landscape", placeholder: "Competitors, differentiation." },
  { key: "use_of_funds", label: "Use of Funds", placeholder: "Allocation priorities." },
  { key: "dca_value_add", label: "DCA Value-Add", placeholder: "Where can DCA add value beyond capital?" },
];

const INPUT_GROUPS: { title: string; fields: { key: keyof ScorecardInputs; label: string; type: "text" | "number" | "percent" | "currency" | "select" | "bool" | "date"; options?: string[] }[] }[] = [
  {
    title: "Company",
    fields: [
      { key: "sector", label: "Sector", type: "text" },
      { key: "stage", label: "Stage", type: "select", options: ["Pre-Seed","Seed","Series A","Series B","Series C","Growth"] },
      { key: "geography", label: "Geography", type: "text" },
      { key: "founding_year", label: "Founding Year", type: "number" },
      { key: "deal_lead", label: "Deal Lead", type: "text" },
      { key: "vehicle", label: "Vehicle", type: "text" },
      { key: "repeat_founder", label: "Repeat Founder?", type: "bool" },
      { key: "has_technical_cofounder", label: "Technical Co-Founder?", type: "bool" },
    ],
  },
  {
    title: "Round & Capital Structure",
    fields: [
      { key: "fundraise_amount", label: "Fundraise Amount", type: "currency" },
      { key: "valuation", label: "Valuation (Post/Cap)", type: "currency" },
      { key: "prev_valuation", label: "Previous Valuation", type: "currency" },
      { key: "committed_amount", label: "Committed Amount", type: "currency" },
      { key: "round_deadline", label: "Round Deadline", type: "date" },
      { key: "founder_ownership_pct", label: "Founder Ownership %", type: "percent" },
      { key: "bridge_rounds_18mo", label: "# Bridge Rounds (18mo)", type: "number" },
      { key: "total_debt_excl_convertibles", label: "Total Debt (excl. conv)", type: "currency" },
    ],
  },
  {
    title: "Financial & Operating",
    fields: [
      { key: "current_arr", label: "Current ARR", type: "currency" },
      { key: "prior_arr", label: "Prior Year ARR", type: "currency" },
      { key: "forecast_arr", label: "Forecast FY ARR", type: "currency" },
      { key: "gross_burn", label: "Gross Burn ($/mo)", type: "currency" },
      { key: "net_burn", label: "Net Burn ($/mo)", type: "currency" },
      { key: "cash_balance", label: "Cash Balance", type: "currency" },
      { key: "total_raised", label: "Total Raised", type: "currency" },
      { key: "gross_margin", label: "Gross Margin", type: "percent" },
      { key: "fcst_gross_margin", label: "Forecast GM", type: "percent" },
      { key: "acv", label: "ACV", type: "currency" },
      { key: "employee_count", label: "Employees", type: "number" },
      { key: "nrr", label: "NRR", type: "percent" },
      { key: "grr", label: "GRR", type: "percent" },
      { key: "top_cust_pct", label: "Top Customer %", type: "percent" },
      { key: "monthly_churn", label: "Monthly Churn", type: "percent" },
    ],
  },
];

const fmt = {
  pct: (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`),
  money: (v: number | null) => (v == null ? "—" : `$${Math.round(v).toLocaleString()}`),
  num: (v: number | null, d = 1) => (v == null ? "—" : v.toFixed(d)),
  compactMoney: (v: number | null) => {
    if (v == null) return "—";
    const abs = Math.abs(v);
    const sign = v < 0 ? "-" : "";
    if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
    return `${sign}$${Math.round(abs).toLocaleString()}`;
  },
};

const CURRENCY_METRICS = new Set(["current_arr", "net_burn", "acv", "prior_arr", "forecast_arr", "gross_burn", "cash_balance"]);
const PCT_METRICS = new Set(["gross_margin", "fcst_gross_margin", "nrr", "grr", "annual_growth", "top_cust_pct", "monthly_churn"]);

function formatMetricValue(metric: string, v: number | null): string {
  if (v == null) return "—";
  if (metric === "ev_revenue") return `${v.toFixed(1)}x`;
  if (CURRENCY_METRICS.has(metric)) return fmt.compactMoney(v);
  if (PCT_METRICS.has(metric)) return fmt.pct(v);
  if (metric === "runway_months") return v.toFixed(0);
  return fmt.num(v, 0);
}

function bandColor(band: string): string {
  if (band === "HIGHLY ATTRACTIVE") return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
  if (band === "MODERATE FIT") return "bg-amber-500/20 text-amber-700 dark:text-amber-300";
  if (band === "BELOW THRESHOLD") return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
  return "bg-destructive/20 text-destructive";
}

export function ScorecardPanel({ dealId }: Props) {
  const { row, loading, saving, load, ensureDraft, save, approve, benchmarkMap } = useDealScorecard(dealId);
  const [tab, setTab] = useState("summary");
  const [drafting, setDrafting] = useState(false);
  const [filling, setFilling] = useState(false);

  const runAiDraft = async () => {
    const r = await ensureDraft();
    if (!r) return;
    setDrafting(true);
    const { data, error } = await supabase.functions.invoke("score-deal", {
      body: { scorecard_id: r.id, deal_id: dealId },
    });
    setDrafting(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "AI draft failed");
      return;
    }
    toast.success("AI draft ready — review & approve");
    load();
  };

  const [fillingField, setFillingField] = useState<string | null>(null);

  const fillBlanks = async (fields?: string[]) => {
    const r = await ensureDraft();
    if (!r) return;
    const key = fields && fields.length === 1 ? fields[0] : "__all__";
    if (fields && fields.length === 1) setFillingField(key);
    else setFilling(true);
    const { data, error } = await supabase.functions.invoke("fill-scorecard-blanks", {
      body: { scorecard_id: r.id, deal_id: dealId, ...(fields ? { fields } : {}) },
    });
    setFilling(false);
    setFillingField(null);
    const err = (data as { error?: string })?.error ?? error?.message;
    if (err) {
      toast.error(err);
      return;
    }
    const filled = (data as { filled?: number })?.filled ?? 0;
    if (filled === 0) toast.info("Couldn't confidently fill from the available notes.");
    else toast.success(`Filled ${filled} field${filled === 1 ? "" : "s"} from notes & sources`);
    load();
  };

  const exportMemo = async () => {
    if (!row) return;
    const { data: deal } = await supabase
      .from("deals")
      .select("company_name")
      .eq("id", dealId)
      .maybeSingle();
    const narrative: Record<string, string | null> = {};
    for (const k of ["company_overview","investment_thesis","traction_milestones","business_model","key_strengths","key_risks","investor_base","competitive_landscape","use_of_funds","dca_value_add"]) {
      narrative[k] = (row[k] as string | null) ?? null;
    }
    try {
      exportMemoPdf({
        companyName: deal?.company_name ?? "Untitled Deal",
        inputs,
        ratings,
        computed,
        narrative,
        status: row.status,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
      });
      toast.success("Memo exported");
    } catch (e) {
      toast.error("Export failed");
      console.error(e);
    }
  };


  const inputs = useMemo(() => inputsFromRow(row), [row]);
  const ratings = (row?.qualitative_ratings ?? {}) as QualitativeRatings;
  const computed = useMemo(
    () => computeSnapshot(inputs, ratings, benchmarkMap),
    [inputs, ratings, benchmarkMap],
  );

  const isApproved = row?.status === "approved";
  const readonly = isApproved;

  const setField = async (key: string, value: unknown) => {
    const r = await ensureDraft();
    if (!r) return;
    await save({ [key]: value } as Partial<DealScorecardRow>);
  };

  const setRating = async (cat: keyof QualitativeRatings, patch: Partial<QualitativeRating>) => {
    const r = await ensureDraft();
    if (!r) return;
    const next: QualitativeRatings = { ...(r.qualitative_ratings ?? {}), [cat]: { ...(r.qualitative_ratings?.[cat] ?? {}), ...patch } };
    await save({ qualitative_ratings: next });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <CardTitle>Investment Scorecard</CardTitle>
          {row && (
            <Badge variant="outline" className="capitalize">{row.status}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {row && (
            <div className="text-right">
              <div className={`px-3 py-1 rounded-md text-sm font-semibold ${bandColor(computed.classification)}`}>
                {computed.blended_score.toFixed(1)} / 100 · {computed.classification}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Qual {computed.qual_total}/25 · Quant {computed.quant_total.toFixed(1)}/25
              </div>
            </div>
          )}
          {!row && !loading && (
            <Button onClick={ensureDraft} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start scorecard"}
            </Button>
          )}
          {row && (
            <Button variant="outline" onClick={exportMemo} className="gap-2">
              <FileDown className="h-4 w-4" /> Export memo
            </Button>
          )}
          {row && !isApproved && (
            <>
              <Button variant="outline" onClick={() => fillBlanks()} disabled={filling || saving || drafting} className="gap-2">
                {filling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Fill blanks with AI
              </Button>
              <Button variant="outline" onClick={runAiDraft} disabled={drafting || saving || filling} className="gap-2">
                {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI draft
              </Button>
              <Button onClick={approve} disabled={saving}>Approve</Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : !row ? (
          <p className="text-sm text-muted-foreground">
            No scorecard yet. Click <b>Start scorecard</b> to populate inputs from this deal, then enter qualitative ratings, narrative, and review computed metrics.
          </p>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="quant">Quantitative</TabsTrigger>
              <TabsTrigger value="qual">Qualitative</TabsTrigger>
              <TabsTrigger value="narrative">Narrative</TabsTrigger>
              <TabsTrigger value="risks">Hard Stops & Risk</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="pt-4 space-y-6">
              {/* Score header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`rounded-md p-4 ${bandColor(computed.classification)}`}>
                  <div className="text-xs uppercase tracking-wide opacity-80">Blended Score</div>
                  <div className="text-3xl font-bold mt-1">{computed.blended_score.toFixed(1)}<span className="text-base font-normal opacity-70"> / 100</span></div>
                  <div className="text-xs font-semibold mt-1">{computed.classification}</div>
                </div>
                <div className="rounded-md p-4 border">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Qualitative</div>
                  <div className="text-3xl font-bold mt-1">{computed.qual_total}<span className="text-base font-normal text-muted-foreground"> / 25</span></div>
                  <div className="text-xs text-muted-foreground mt-1">Weighted: {computed.qual_score.toFixed(1)} / 60</div>
                </div>
                <div className="rounded-md p-4 border">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Quantitative</div>
                  <div className="text-3xl font-bold mt-1">{computed.quant_total.toFixed(1)}<span className="text-base font-normal text-muted-foreground"> / 25</span></div>
                  <div className="text-xs text-muted-foreground mt-1">Weighted: {computed.quant_score.toFixed(1)} / 40</div>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {computed.hard_stop_failed ? (
                  <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Hard stop failed</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-600/40"><CheckCircle2 className="h-3 w-3" /> Hard stops clear</Badge>
                )}
                <Badge variant={computed.red_flag_count > 0 ? "destructive" : "outline"} className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {computed.red_flag_count} red
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {computed.yellow_flag_count} yellow
                </Badge>
              </div>

              {/* Qualitative breakdown */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Qualitative Ratings</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {QUAL_CATEGORIES.map((c) => {
                    const r = ratings[c.key] ?? {};
                    return (
                      <div key={c.key as string} className="border rounded-md p-3">
                        <div className="text-xs text-muted-foreground truncate" title={c.label}>{c.label.split("&")[0].trim()}</div>
                        <div className="text-xl font-semibold mt-1">{r.score ? `${r.score}/5` : "—"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top quant metrics */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Quantitative Highlights</h4>
                <div className="border rounded-md divide-y">
                  {[...computed.metrics]
                    .filter((m) => m.value != null)
                    .sort((a, b) => b.weighted_score - a.weighted_score)
                    .slice(0, 5)
                    .map((m) => (
                      <div key={m.metric} className="flex items-center justify-between p-2 text-sm">
                        <div className="font-medium">{m.label}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatMetricValue(m.metric, m.value)}</span>
                          <span>vs {formatMetricValue(m.metric, m.benchmark)}</span>
                          <Badge variant="outline" className="text-xs">Tier {m.tier || "—"}</Badge>
                          <span className="text-foreground font-semibold w-12 text-right">{m.weighted_score.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  {computed.metrics.every((m) => m.value == null) && (
                    <div className="p-3 text-sm text-muted-foreground">No quantitative inputs yet.</div>
                  )}
                </div>
              </div>

              {/* Narrative snippets */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Narrative</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "company_overview", label: "Company Overview" },
                    { key: "investment_thesis", label: "Investment Thesis" },
                    { key: "key_strengths", label: "Key Strengths" },
                    { key: "key_risks", label: "Key Risks" },
                  ].map((n) => {
                    const v = (row[n.key as keyof DealScorecardRow] as string | null) ?? "";
                    return (
                      <div key={n.key} className="border rounded-md p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{n.label}</div>
                        <div className="text-sm whitespace-pre-wrap line-clamp-5">{v.trim() || <span className="text-muted-foreground italic">Not filled.</span>}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sources / uploads */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Sources</h4>
                <UploadsPanel scorecardId={row.id} dealId={dealId} readonly={readonly} />
              </div>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-6 pt-4">
              {INPUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h4 className="font-medium mb-3">{group.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {group.fields.map((f) => {
                      const raw = (inputs as Record<string, unknown>)[f.key as string];
                      const displayVal =
                        f.type === "percent" && typeof raw === "number" ? `${+(raw * 100).toFixed(4)}%`
                        : f.type === "currency" && typeof raw === "number" ? `$${raw.toLocaleString()}`
                        : f.type === "number" && typeof raw === "number" ? raw.toLocaleString()
                        : raw == null ? "" : String(raw);
                      const fieldKey = f.key as string;
                      const isFieldBlank = raw == null || raw === "";
                      const isFillingThis = fillingField === fieldKey;
                      return (
                        <div key={fieldKey} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs">{f.label}</Label>
                            {isFieldBlank && !readonly && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                                onClick={() => fillBlanks([fieldKey])}
                                disabled={filling || !!fillingField || saving || drafting}
                                title="Fill from notes with AI"
                              >
                                {isFillingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                AI
                              </Button>
                            )}
                          </div>
                          {f.type === "select" ? (
                            <Select
                              value={(raw as string) ?? ""}
                              onValueChange={(v) => setField(f.key as string, v || null)}
                              disabled={readonly}
                            >
                              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                              <SelectContent>
                                {f.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : f.type === "bool" ? (
                            <Select
                              value={raw === true ? "yes" : raw === false ? "no" : ""}
                              onValueChange={(v) => setField(f.key as string, v === "yes" ? true : v === "no" ? false : null)}
                              disabled={readonly}
                            >
                              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              key={`${row.id}:${f.key as string}:${displayVal}`}
                              type={f.type === "date" ? "date" : "text"}
                              inputMode={f.type === "number" || f.type === "currency" || f.type === "percent" ? "decimal" : undefined}
                              defaultValue={displayVal}
                              disabled={readonly}
                              onFocus={(e) => {
                                if (f.type === "currency" || f.type === "number") {
                                  e.target.value = raw == null ? "" : String(raw);
                                } else if (f.type === "percent") {
                                  e.target.value = raw == null ? "" : String(+(Number(raw) * 100).toFixed(4));
                                }
                              }}
                              onBlur={(e) => {
                                const v = e.target.value.replace(/[$,\s%]/g, "");
                                if (v === "" && raw == null) return;
                                let parsed: unknown = v === "" ? null : v;
                                if (f.type === "number" || f.type === "currency") parsed = v === "" ? null : Number(v);
                                if (f.type === "percent") parsed = v === "" ? null : Number(v) / 100;
                                if (parsed !== raw) setField(f.key as string, parsed);
                                // Reformat display
                                if (f.type === "currency" && typeof parsed === "number") e.target.value = `$${parsed.toLocaleString()}`;
                                else if (f.type === "number" && typeof parsed === "number") e.target.value = parsed.toLocaleString();
                                else if (f.type === "percent" && typeof parsed === "number") e.target.value = `${+(parsed * 100).toFixed(4)}%`;
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <Separator />
              <div>
                <h4 className="font-medium mb-3">Auto-calculated</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">EV/Rev:</span> {fmt.num(computed.autocalcs.ev_revenue, 1)}x</div>
                  <div><span className="text-muted-foreground">Runway:</span> {fmt.num(computed.autocalcs.runway_months, 1)} mo</div>
                  <div><span className="text-muted-foreground">Annual Growth:</span> {fmt.pct(computed.autocalcs.annual_growth)}</div>
                  <div><span className="text-muted-foreground">MoM Growth:</span> {fmt.pct(computed.autocalcs.mom_growth)}</div>
                  <div><span className="text-muted-foreground">Dilution:</span> {fmt.pct(computed.autocalcs.implied_dilution)}</div>
                  <div><span className="text-muted-foreground">Burn-to-Round:</span> {fmt.pct(computed.autocalcs.burn_to_round)}</div>
                  <div><span className="text-muted-foreground">Burn Multiple:</span> {fmt.num(computed.autocalcs.burn_multiple, 2)}</div>
                  <div><span className="text-muted-foreground">Age:</span> {fmt.num(computed.autocalcs.company_age, 1)} yr</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quant" className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">Metric</th>
                      <th className="py-2 pr-3">Value</th>
                      <th className="py-2 pr-3">Benchmark</th>
                      <th className="py-2 pr-3">Variance</th>
                      <th className="py-2 pr-3">Tier</th>
                      <th className="py-2 pr-3 text-right">Weighted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computed.metrics.map((m) => (
                      <tr key={m.metric} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{m.label}</td>
                        <td className="py-2 pr-3">{formatMetricValue(m.metric, m.value)}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{formatMetricValue(m.metric, m.benchmark)}</td>
                        <td className="py-2 pr-3">{m.variance == null ? "—" : fmt.pct(m.variance)}</td>
                        <td className="py-2 pr-3">{m.tier === 0 ? "—" : m.tier}</td>
                        <td className="py-2 pr-3 text-right">{m.weighted_score.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-2 pr-3" colSpan={5}>Quantitative Total</td>
                      <td className="py-2 pr-3 text-right">{computed.quant_total.toFixed(1)} / 25</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="qual" className="space-y-4 pt-4">
              {QUAL_CATEGORIES.map((c) => {
                const r: QualitativeRating = ratings[c.key] ?? {};
                const ratingKey = `rating:${c.key as string}`;
                const isBlankRating = r.score == null;
                const isFillingThis = fillingField === ratingKey;
                return (
                  <div key={c.key} className="border rounded-md p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{c.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{c.rubric}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isBlankRating && !readonly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                            onClick={() => fillBlanks([ratingKey])}
                            disabled={filling || !!fillingField || saving || drafting}
                            title="Score & explain with AI"
                          >
                            {isFillingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                            AI
                          </Button>
                        )}
                        <Select
                          value={r.score ? String(r.score) : ""}
                          onValueChange={(v) => setRating(c.key, { score: Number(v) })}
                          disabled={readonly}
                        >
                          <SelectTrigger className="w-28"><SelectValue placeholder="Score" /></SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n} / 5</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Rationale / notes"
                      defaultValue={r.rationale ?? ""}
                      disabled={readonly}
                      onBlur={(e) => {
                        if (e.target.value !== (r.rationale ?? "")) setRating(c.key, { rationale: e.target.value });
                      }}
                      rows={2}
                    />
                  </div>
                );
              })}
              <div className="text-sm font-semibold text-right">
                Qualitative Total: {computed.qual_total} / 25
              </div>
            </TabsContent>

            <TabsContent value="narrative" className="space-y-4 pt-4">
              {NARRATIVE_FIELDS.map((f) => {
                const narrKey = f.key as string;
                const val = (row[f.key] as string) ?? "";
                const isFieldBlank = val.trim() === "";
                const isFillingThis = fillingField === narrKey;
                return (
                  <div key={narrKey} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Label>{f.label}</Label>
                      {isFieldBlank && !readonly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                          onClick={() => fillBlanks([narrKey])}
                          disabled={filling || !!fillingField || saving || drafting}
                          title="Draft from notes with AI"
                        >
                          {isFillingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                          AI
                        </Button>
                      )}
                    </div>
                    <Textarea
                      defaultValue={val}
                      placeholder={f.placeholder}
                      disabled={readonly}
                      onBlur={(e) => {
                        if (e.target.value !== val) setField(narrKey, e.target.value || null);
                      }}
                      rows={3}
                    />
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="risks" className="pt-4 space-y-6">
              <div>
                <h4 className="font-medium mb-2">Hard Stops</h4>
                <div className="border rounded-md divide-y">
                  {computed.hard_stops.map((h) => (
                    <div key={h.key} className="flex items-center justify-between p-3 text-sm">
                      <div>
                        <div className="font-medium">{h.rule}</div>
                        <div className="text-xs text-muted-foreground">{h.data}</div>
                      </div>
                      {h.failed ? (
                        <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> FAIL</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> PASS</Badge>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm">
                  Verdict:{" "}
                  {computed.hard_stop_failed ? (
                    <span className="font-semibold text-destructive">HARD STOP — DO NOT PROCEED</span>
                  ) : (
                    <span className="font-semibold text-emerald-600">CLEAR</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Risk Flags ({computed.red_flag_count} red · {computed.yellow_flag_count} yellow)</h4>
                <div className="border rounded-md divide-y">
                  {computed.risk_flags.map((f) => (
                    <div key={f.key} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={f.type === "RED" ? "destructive" : "secondary"} className="text-xs">{f.type}</Badge>
                        <div>
                          <div className="font-medium">{f.risk}</div>
                          <div className="text-xs text-muted-foreground">{f.check}</div>
                        </div>
                      </div>
                      {f.status === "FLAG" ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> FLAG</Badge>
                      ) : f.status === "MANUAL" ? (
                        <Badge variant="outline">Manual</Badge>
                      ) : f.status === "N/A" ? (
                        <Badge variant="outline">N/A</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Pass</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
