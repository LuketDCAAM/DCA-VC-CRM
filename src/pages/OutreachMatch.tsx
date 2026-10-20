import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedDeals } from '@/hooks/useOptimizedDeals';
import { useInvestorsSimple } from '@/hooks/useInvestorsSimple';
import { useInvestorCadences } from '@/hooks/outreach/useInvestorCadences';
import { useOutreachBatches } from '@/hooks/outreach/useOutreachBatches';
import { useOutreachDraft } from '@/hooks/outreach/useOutreachDraft';
import { matchInvestorsForDeals } from '@/lib/outreach/matching';
import { formatDateOnly } from '@/lib/outreach/constants';
import { ArrowLeft, Loader2, Send, X } from 'lucide-react';

const RECENT_DAYS = 14;

/** Pick deals, see ranked investors, and draft one intro email per chosen investor. */
export default function OutreachMatch() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deals } = useOptimizedDeals();
  const { investors } = useInvestorsSimple();
  const { byInvestor } = useInvestorCadences();
  const { createBatch } = useOutreachBatches();
  const { generate } = useOutreachDraft();

  const selectedIds = useMemo(() => (params.get('deals') || '').split(',').filter(Boolean), [params]);
  const setSelectedIds = (ids: string[]) => setParams(ids.length ? { deals: ids.join(',') } : {}, { replace: true });

  const [dealSearch, setDealSearch] = useState('');
  const [invSearch, setInvSearch] = useState('');
  const [minScore, setMinScore] = useState(30);
  const [includeSent, setIncludeSent] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [sending, setSending] = useState<string | null>(null);

  const selectedDeals = useMemo(() => deals.filter((d) => selectedIds.includes(d.id)), [deals, selectedIds]);

  // Deal/investor pairs already linked or already sent in an earlier batch.
  const { data: sentPairs = new Set<string>() } = useQuery({
    queryKey: ['deal-match-sent', selectedIds.join(',')],
    enabled: selectedIds.length > 0,
    queryFn: async () => {
      const [links, items] = await Promise.all([
        supabase.from('deal_investors').select('deal_id, investor_id').in('deal_id', selectedIds),
        supabase.from('outreach_batch_items').select('deal_ids, investor_id').overlaps('deal_ids', selectedIds),
      ]);
      const s = new Set<string>();
      (links.data || []).forEach((r) => s.add(`${r.deal_id}:${r.investor_id}`));
      (items.data || []).forEach((r) => (r.deal_ids || []).forEach((d: string) => s.add(`${d}:${r.investor_id}`)));
      return s;
    },
  });

  const matches = useMemo(
    () =>
      matchInvestorsForDeals(selectedDeals, investors, { sentPairs, minScore, includeSent }).filter((m) => {
        const q = invSearch.trim().toLowerCase();
        return !q || `${m.investor.contact_name} ${m.investor.firm_name || ''}`.toLowerCase().includes(q);
      }),
    [selectedDeals, investors, sentPairs, minScore, includeSent, invSearch],
  );

  // Preselect the top 10 whenever the deal set changes.
  useEffect(() => {
    setPicked(new Set(matches.slice(0, 10).map((m) => m.investor.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(','), investors.length]);

  const dealOptions = useMemo(() => {
    const q = dealSearch.trim().toLowerCase();
    if (!q) return [];
    return deals
      .filter((d) => !selectedIds.includes(d.id) && d.company_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [deals, dealSearch, selectedIds]);

  const recentDays = (investorId: string) => {
    const last = byInvestor.get(investorId)?.last_contacted_at;
    if (!last) return null;
    const days = Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000);
    return days <= RECENT_DAYS ? days : null;
  };

  const send = async () => {
    if (!user) return;
    const chosen = matches.filter((m) => picked.has(m.investor.id));
    if (!chosen.length) return;
    setSending('Creating drafts…');
    const title = `Deal match: ${selectedDeals.map((d) => d.company_name).join(', ')}`.slice(0, 120);
    const batch = await createBatch(
      formatDateOnly(new Date()),
      title,
      chosen.map((m) => ({
        investor_id: m.investor.id,
        owner_id: user.id,
        deal_ids: m.deals.map((d) => d.deal.id),
        match_rationale: Object.fromEntries(m.deals.map((d) => [d.deal.id, d.rationale])),
      })),
      note || undefined,
      'deal_match',
    );
    if (!batch) return setSending(null);
    const { data: items } = await supabase.from('outreach_batch_items').select('id').eq('batch_id', batch.id);
    let n = 0;
    for (const it of items || []) {
      setSending(`Writing draft ${++n} of ${items!.length}…`);
      await generate('batch_item', it.id);
    }
    setSending(null);
    navigate('/outreach?tab=digests');
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/outreach')} className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Outreach
        </Button>
        <h1 className="text-xl md:text-2xl font-semibold">Match deals to investors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick deals, choose who should see them, and we'll draft one email per investor.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Deals ({selectedDeals.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input placeholder="Add a deal…" value={dealSearch} onChange={(e) => setDealSearch(e.target.value)} />
              {dealOptions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                  {dealOptions.map((d) => (
                    <button
                      key={d.id}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => {
                        setSelectedIds([...selectedIds, d.id]);
                        setDealSearch('');
                      }}
                    >
                      {d.company_name}
                      <span className="text-xs text-muted-foreground ml-2">{d.round_stage || ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedDeals.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-2 rounded-md border p-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.company_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[d.sector, d.round_stage, d.city || d.location].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Remove deal"
                  onClick={() => setSelectedIds(selectedIds.filter((x) => x !== d.id))}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {!selectedDeals.length && <p className="text-sm text-muted-foreground">Search above to add deals.</p>}

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs">Minimum fit score: {minScore}</Label>
              <Slider value={[minScore]} min={0} max={90} step={5} onValueChange={(v) => setMinScore(v[0])} />
              <div className="flex items-center justify-between">
                <Label htmlFor="incl" className="text-xs">Show investors already sent these</Label>
                <Switch id="incl" checked={includeSent} onCheckedChange={setIncludeSent} />
              </div>
              <Label className="text-xs">Note to include (optional)</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Round closes end of month" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Investor matches ({matches.length})</CardTitle>
              <Button onClick={send} disabled={!picked.size || !!sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {sending || `Draft ${picked.size} email${picked.size === 1 ? '' : 's'}`}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input className="max-w-xs" placeholder="Filter investors…" value={invSearch} onChange={(e) => setInvSearch(e.target.value)} />
              <Button variant="ghost" size="sm" onClick={() => setPicked(new Set(matches.map((m) => m.investor.id)))}>Select all</Button>
              <Button variant="ghost" size="sm" onClick={() => setPicked(new Set())}>Clear</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-3">
              <div className="space-y-2">
                {matches.map((m) => {
                  const recent = recentDays(m.investor.id);
                  const on = picked.has(m.investor.id);
                  return (
                    <label key={m.investor.id} className="flex gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/40">
                      <Checkbox
                        checked={on}
                        onCheckedChange={(c) => {
                          const next = new Set(picked);
                          c ? next.add(m.investor.id) : next.delete(m.investor.id);
                          setPicked(next);
                        }}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{m.investor.contact_name}</span>
                          {m.investor.firm_name && <span className="text-xs text-muted-foreground">{m.investor.firm_name}</span>}
                          <Badge variant="secondary">Fit {m.score}</Badge>
                          {recent !== null && (
                            <Badge variant="outline">Contacted {recent === 0 ? 'today' : `${recent} day${recent === 1 ? '' : 's'} ago`}</Badge>
                          )}
                          {m.alreadySent && <Badge variant="outline">Already sent</Badge>}
                          {!m.investor.contact_email && <Badge variant="destructive">No email</Badge>}
                        </div>
                        {m.deals.map((d) => (
                          <p key={d.deal.id} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{d.deal.company_name}</span> — {d.reasons.join(' · ') || 'General fit'}
                          </p>
                        ))}
                      </div>
                    </label>
                  );
                })}
                {selectedDeals.length > 0 && !matches.length && (
                  <p className="text-sm text-muted-foreground py-6 text-center">No investors meet this fit score. Try lowering it.</p>
                )}
                {!selectedDeals.length && (
                  <p className="text-sm text-muted-foreground py-6 text-center">Add a deal to see matching investors.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
