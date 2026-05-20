import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useInvestmentThesis } from "@/hooks/agent/useInvestmentThesis";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Loader2, Lock } from "lucide-react";

const DEFAULT_THESIS = `# Investment Thesis

DCA Asset Management invests in early-stage technology companies (Pre-Seed through Series A) where the founding team has deep domain expertise, the product has clear technical differentiation, and the market is large enough to support a venture-scale outcome. We have high conviction in technology-driven transformation of physical-world industries — specifically Aerospace & Defense, AI Infrastructure, Robotics, Vertical AI Native SaaS, Cybersecurity, and Supply Chain & Logistics. We look for founders who are leveraging AI, automation, or proprietary data to build durable competitive moats. Capital efficiency, founder equity retention, and execution velocity are primary signals. For non-deep tech companies, we prioritize deals with ≥$250k ARR and strong MoM growth as early proof of product-market fit.

## Filters

### Sectors

- ✅ **Tier 1 — High Conviction:** Aerospace & Defense, AI Infrastructure, Robotics, Vertical AI Native SaaS, Cybersecurity, Supply Chain & Logistics
- ✅ **Tier 2 — Standard:** Digital Health, FinTech, GovTech, Energy Storage, Tobacco/Cannabis
- ⚠️ **Tier 3 — Hesitant:** Consumer (CPG), EdTech, E-commerce, Gaming
- ❌ **Excluded:** Pharma, Medical Devices

### Stages

- Pre-Seed, Seed, Series A only
- Series B and beyond: hard stop

### Geographies

- **Tier 1** (target 15–20x PostMoney/ARR): Bay Area, NYC, Boston
- **Tier 2** (target 10–15x): Austin, Seattle, LA, Miami, Chicago
- **Tier 3** (target 6–10x): Rest of US / International

### Business Models

- Vertical SaaS, Subscription, AI Infrastructure, Deep Tech, Defense Tech, B2B Software, Marketplace with strong network effects
- Hardware acceptable if GM ≥40%

## Must-Haves

- Founding team retains ≥20% equity pre-round
- Pre-Seed, Seed, or Series A stage
- Technical co-founder or CTO present (mandatory for AI, Robotics, Aerospace deals)
- Company <3.5 years old OR ≥$100k ARR (exemption: Aerospace, Defense, Robotics)
- US market focus (domestic HQ or clear US GTM)

## Deal-Breakers

- Stage: Series B or later
- Sector: Pharma or Medical Devices
- Founder equity <20% pre-round (no exceptions for stage)
- Company >3.5 years old AND <$100k ARR (outside of Aerospace, Defense, Robotics)
- 2 bridge rounds (SAFEs/Notes) in last 18 months without a valuation step-up
- $250k in non-convertible debt (equipment loans, bank lines, RBF, term loans)
- 70% ARR from a single customer (outside GovTech/Defense)
- NRR <80% or monthly churn >5% for SaaS/subscription businesses

## Scoring Weights

| Category | Weight | Rationale |
|---|---|---|
| Team | 30 | Domain expertise, prior exits, and execution velocity are DCA's primary alpha signal |
| Traction | 25 | ARR level, MoM growth velocity, capital efficiency — proof that the business works |
| Market | 20 | TAM size, competitive positioning, barriers to entry |
| Sector Fit | 15 | Tier 1 sectors get full weight; hesitant sectors penalized |
| Stage Fit | 5 | Binary in most cases (hard stop handles true mismatches); nuance for edge cases near the boundary |
| Narrative | 5 | Differentiation story, clarity of vision, founder-market fit framing |
| **Total** | **100** | |
`;

export default function ThesisSettings() {
  const { thesis, loading, save } = useInvestmentThesis();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    if (thesis && !thesis.narrative) setDraft(DEFAULT_THESIS);
  }, [thesis]);

  if (loading || rolesLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading thesis…
      </div>
    );
  }
  if (!thesis) return <div className="p-8">No thesis row.</div>;

  const content = draft ?? thesis.narrative ?? DEFAULT_THESIS;
  const isDirty = draft !== null && draft !== (thesis.narrative ?? "");

  const onSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    const { error } = await save({ narrative: content });
    setSaving(false);
    if (error) toast.error("Save failed: " + (error as { message?: string }).message);
    else {
      toast.success("Thesis saved");
      setDraft(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Investment Thesis</h1>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Read-only — only admins can edit
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        The Analyst agent reads this Markdown document when scoring inbound deals. Be specific — vague thesis = generic scoring.
      </p>

      {isAdmin ? (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="edit" className="w-full">
              <div className="border-b px-4 pt-3">
                <TabsList>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="edit" className="p-4">
                <Textarea
                  value={content}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={32}
                  className="font-mono text-sm"
                  placeholder="# Investment Thesis&#10;&#10;Write your thesis in Markdown…"
                />
              </TabsContent>
              <TabsContent value="preview" className="p-6">
                <article className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </article>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <div className="flex justify-end gap-2 sticky bottom-4">
          <Button variant="outline" onClick={() => setDraft(null)} disabled={!isDirty || saving}>
            Discard
          </Button>
          <Button onClick={onSave} disabled={!isDirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save thesis
          </Button>
        </div>
      )}
    </div>
  );
}
