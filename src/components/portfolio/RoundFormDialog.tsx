import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toEditable, toStored } from '@/lib/portfolio/kpiFields';
import { ROUND_TYPES, type PortcoRound, type RoundValues } from '@/hooks/portfolio/usePortcoRounds';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  round: PortcoRound | null;
  saving: boolean;
  onSave: (values: RoundValues, id?: string) => Promise<boolean>;
}

/** Price per share is stored in cents but usually a small dollar figure, so allow decimals. */
function ppsToEditable(value: number | null | undefined): string {
  if (value == null) return '';
  return String(value / 100);
}

export function RoundFormDialog({ open, onOpenChange, round, saving, onSave }: Props) {
  const [name, setName] = useState(round?.round_name ?? '');
  const [type, setType] = useState(round?.round_type ?? 'none');
  const [closeDate, setCloseDate] = useState(round?.close_date ?? '');
  const [pre, setPre] = useState(toEditable(round?.pre_money_valuation ?? null, 'money'));
  const [post, setPost] = useState(toEditable(round?.post_money_valuation ?? null, 'money'));
  const [pps, setPps] = useState(ppsToEditable(round?.price_per_share));
  const [raised, setRaised] = useState(toEditable(round?.amount_raised ?? null, 'money'));
  const [lead, setLead] = useState(round?.lead_investor ?? '');
  const [participated, setParticipated] = useState(round?.we_participated ?? true);
  const [ourAmount, setOurAmount] = useState(toEditable(round?.our_amount ?? null, 'money'));
  const [ourShares, setOurShares] = useState(round?.our_shares != null ? String(round.our_shares) : '');
  const [source, setSource] = useState(round?.source ?? '');
  const [notes, setNotes] = useState(round?.notes ?? '');

  const submit = async () => {
    if (!name.trim()) return;
    const values: RoundValues = {
      round_name: name.trim(),
      round_type: type === 'none' ? null : type,
      close_date: closeDate || null,
      pre_money_valuation: toStored(pre, 'money'),
      post_money_valuation: toStored(post, 'money'),
      price_per_share: toStored(pps, 'money'),
      amount_raised: toStored(raised, 'money'),
      lead_investor: lead.trim() || null,
      we_participated: participated,
      our_amount: toStored(ourAmount, 'money'),
      our_shares: toStored(ourShares, 'number'),
      source: source.trim() || null,
      notes: notes.trim() || null,
    };
    const ok = await onSave(values, round?.id);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{round ? `Edit ${round.round_name}` : 'Add funding round'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Round name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Series A" />
            </div>
            <div>
              <Label className="text-xs">Round type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unspecified</SelectItem>
                  {ROUND_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Close date</Label>
              <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Pre-money ($)</Label>
              <Input inputMode="decimal" value={pre} onChange={(e) => setPre(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Post-money ($)</Label>
              <Input inputMode="decimal" value={post} onChange={(e) => setPost(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Price per share ($)</Label>
              <Input inputMode="decimal" value={pps} onChange={(e) => setPps(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Amount raised ($)</Label>
              <Input inputMode="decimal" value={raised} onChange={(e) => setRaised(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Lead investor</Label>
              <Input value={lead} onChange={(e) => setLead(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Our amount ($)</Label>
              <Input inputMode="decimal" value={ourAmount} onChange={(e) => setOurAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Our shares</Label>
              <Input inputMode="decimal" value={ourShares} onChange={(e) => setOurShares(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">We participated</Label>
              <p className="text-xs text-muted-foreground">Turn off to track a round we did not invest in.</p>
            </div>
            <Switch checked={participated} onCheckedChange={setParticipated} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Source</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Board deck, Pitchbook…" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save round'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
