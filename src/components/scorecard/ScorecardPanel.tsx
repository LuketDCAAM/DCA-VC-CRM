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
import { CheckCircle2, AlertTriangle, XCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { useDealScorecard, inputsFromRow, type DealScorecardRow } from "@/hooks/useDealScorecard";
import { computeSnapshot } from "@/lib/scorecard/engine";
import type { QualitativeRating, QualitativeRatings, ScorecardInputs } from "@/lib/scorecard/types";

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
};

function bandColor(band: string): string {
  if (band === "HIGHLY ATTRACTIVE") return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
  if (band === "MODERATE FIT") return "bg-amber-500/20 text-amber-700 dark:text-amber-300";
  if (band === "BELOW THRESHOLD") return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
  return "bg-destructive/20 text-destructive";
}

export function ScorecardPanel({ dealId }: Props) {
  const { row, loading, saving, ensureDraft, save, approve, benchmarkMap } = useDealScorecard(dealId);
  const [tab, setTab] = useState("inputs");

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
          {row && !isApproved && (
            <Button onClick={approve} disabled={saving}>Approve</Button>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="quant">Quantitative</TabsTrigger>
              <TabsTrigger value="qual">Qualitative</TabsTrigger>
              <TabsTrigger value="narrative">Narrative</TabsTrigger>
              <TabsTrigger value="risks">Hard Stops & Risk</TabsTrigger>
            </TabsList>

            <TabsContent value="inputs" className="space-y-6 pt-4">
              {INPUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h4 className="font-medium mb-3">{group.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {group.fields.map((f) => {
                      const raw = (inputs as Record<string, unknown>)[f.key as string];
                      const displayVal =
                        f.type === "percent" && typeof raw === "number" ? (raw * 100).toString()
                        : raw == null ? "" : String(raw);
                      return (
                        <div key={f.key as string} className="space-y-1">
                          <Label className="text-xs">{f.label}</Label>
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
                              type={f.type === "date" ? "date" : f.type === "text" ? "text" : "number"}
                              value={displayVal}
                              disabled={readonly}
                              onBlur={(e) => {
                                const v = e.target.value;
                                if (v === "" && raw == null) return;
                                let parsed: unknown = v === "" ? null : v;
                                if (f.type === "number" || f.type === "currency") parsed = v === "" ? null : Number(v);
                                if (f.type === "percent") parsed = v === "" ? null : Number(v) / 100;
                                if (parsed !== raw) setField(f.key as string, parsed);
                              }}
                              onChange={() => { /* commit on blur */ }}
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
                        <td className="py-2 pr-3">{m.value == null ? "—" : m.metric.includes("margin") || m.metric.includes("nrr") || m.metric.includes("grr") || m.metric === "annual_growth" || m.metric === "top_cust_pct" ? fmt.pct(m.value) : m.metric === "ev_revenue" ? `${m.value.toFixed(1)}x` : fmt.num(m.value, 0)}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{m.benchmark == null ? "—" : m.metric.includes("margin") || m.metric.includes("nrr") || m.metric.includes("grr") || m.metric === "annual_growth" || m.metric === "top_cust_pct" ? fmt.pct(m.benchmark) : m.metric === "ev_revenue" ? `${m.benchmark}x` : m.benchmark.toLocaleString()}</td>
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
                return (
                  <div key={c.key} className="border rounded-md p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{c.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{c.rubric}</div>
                      </div>
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
              {NARRATIVE_FIELDS.map((f) => (
                <div key={f.key as string} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Textarea
                    defaultValue={(row[f.key] as string) ?? ""}
                    placeholder={f.placeholder}
                    disabled={readonly}
                    onBlur={(e) => {
                      if (e.target.value !== ((row[f.key] as string) ?? "")) setField(f.key as string, e.target.value || null);
                    }}
                    rows={3}
                  />
                </div>
              ))}
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
