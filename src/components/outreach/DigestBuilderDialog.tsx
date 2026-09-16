import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { formatDateOnly } from '@/lib/outreach/constants';
import { suggestDealsForInvestor } from '@/lib/outreach/matching';
import type { Deal } from '@/types/deal';
import type { Investor } from '@/types/investor';
import type { NewBatchItem } from '@/hooks/outreach/useOutreachBatches';

interface DigestBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investors: Investor[];
  deals: Deal[];
  dueInvestorIds: string[];
  onCreate: (periodMonth: string, title: string, items: NewBatchItem[], introNote?: string) => Promise<unknown>;
}

const monthStart = (d = new Date()) => formatDateOnly(new Date(d.getFullYear(), d.getMonth(), 1));

export function DigestBuilderDialog({
  open,
  onOpenChange,
  investors,
  deals,
  dueInvestorIds,
  onCreate,
}: DigestBuilderDialogProps) {
  const { user } = useAuth();
  const [periodMonth, setPeriodMonth] = useState(monthStart());
  const [title, setTitle] = useState('');
  const [introNote, setIntroNote] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [dealPicks, setDealPicks] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  // Suggestions are recomputed from each investor's stated focus.
  const suggestions = useMemo(() => {
    const map: Record<string, ReturnType<typeof suggestDealsForInvestor>> = {};
    investors.forEach((inv) => {
      map[inv.id] = suggestDealsForInvestor(deals, inv, 6);
    });
    return map;
  }, [investors, deals]);

  useEffect(() => {
    if (!open) return;
    const month = new Date();
    setPeriodMonth(monthStart(month));
    setTitle(`${month.toLocaleString('en-US', { month: 'long' })} ${month.getFullYear()} deal share`);
    setIntroNote('');
    const preselect: Record<string, boolean> = {};
    dueInvestorIds.forEach((id) => (preselect[id] = true));
    setSelected(preselect);
    const picks: Record<string, string[]> = {};
    dueInvestorIds.forEach((id) => {
      picks[id] = (suggestions[id] || []).slice(0, 4).map((m) => m.deal.id);
    });
    setDealPicks(picks);
  }, [open, dueInvestorIds, suggestions]);

  const toggleInvestor = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    setDealPicks((prev) => ({
      ...prev,
      [id]: prev[id]?.length ? prev[id] : (suggestions[id] || []).slice(0, 4).map((m) => m.deal.id),
    }));
  };

  const toggleDeal = (investorId: string, dealId: string) => {
    setDealPicks((prev) => {
      const current = prev[investorId] || [];
      return {
        ...prev,
        [investorId]: current.includes(dealId) ? current.filter((d) => d !== dealId) : [...current, dealId],
      };
    });
  };

  const chosenInvestors = investors.filter((i) => selected[i.id]);

  const submit = async () => {
    if (!user || !chosenInvestors.length) return;
    setSaving(true);
    const items: NewBatchItem[] = chosenInvestors.map((inv) => {
      const dealIds = dealPicks[inv.id] || [];
      const rationale: Record<string, string> = {};
      (suggestions[inv.id] || []).forEach((m) => {
        if (dealIds.includes(m.deal.id)) rationale[m.deal.id] = m.rationale;
      });
      return {
        investor_id: inv.id,
        owner_id: inv.relationship_owner || user.id,
        deal_ids: dealIds,
        match_rationale: rationale,
      };
    });
    const created = await onCreate(periodMonth, title, items, introNote || undefined);
    setSaving(false);
    if (created) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Build this month's investor note</DialogTitle>
          <DialogDescription>
            Investors due this month are pre-selected with the deals that fit their focus. Swap anything you like.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Input type="date" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Anything you want every note to mention?</Label>
          <Textarea value={introNote} onChange={(e) => setIntroNote(e.target.value)} rows={2} />
        </div>

        <ScrollArea className="flex-1 min-h-[240px] border rounded-md">
          <div className="divide-y">
            {investors.map((inv) => {
              const isOn = !!selected[inv.id];
              const picks = dealPicks[inv.id] || [];
              return (
                <div key={inv.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isOn} onCheckedChange={() => toggleInvestor(inv.id)} className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{inv.contact_name}</span>
                        {inv.firm_name && <span className="text-xs text-muted-foreground">{inv.firm_name}</span>}
                        {dueInvestorIds.includes(inv.id) && <Badge variant="secondary" className="text-xs">Due now</Badge>}
                      </div>
                      {isOn && (
                        <div className="mt-2 space-y-1.5">
                          {(suggestions[inv.id] || []).map((m) => (
                            <label
                              key={m.deal.id}
                              className="flex items-start gap-2 text-xs cursor-pointer rounded p-1.5 hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={picks.includes(m.deal.id)}
                                onCheckedChange={() => toggleDeal(inv.id, m.deal.id)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0">
                                <span className="font-medium">{m.deal.company_name}</span>
                                <span className="text-muted-foreground"> — {m.rationale}</span>
                              </span>
                            </label>
                          ))}
                          {!(suggestions[inv.id] || []).length && (
                            <p className="text-xs text-muted-foreground">No deals to suggest yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="items-center">
          <span className="text-xs text-muted-foreground mr-auto">
            {chosenInvestors.length} investor{chosenInvestors.length === 1 ? '' : 's'} selected
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !chosenInvestors.length}>Create digest</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
