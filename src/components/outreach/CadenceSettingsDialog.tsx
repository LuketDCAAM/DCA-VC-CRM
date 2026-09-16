import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ANCHOR_RULES,
  CADENCE_INTERVALS,
  computeNextDue,
  formatDateOnly,
  intervalMonths,
} from '@/lib/outreach/constants';
import type { InvestorCadence } from '@/hooks/outreach/useInvestorCadences';

interface CadenceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorId: string;
  investorName: string;
  cadence?: InvestorCadence | null;
  onSave: (investorId: string, updates: Partial<InvestorCadence>) => Promise<unknown>;
  onClear?: (investorId: string) => Promise<unknown>;
}

export function CadenceSettingsDialog({
  open,
  onOpenChange,
  investorId,
  investorName,
  cadence,
  onSave,
  onClear,
}: CadenceSettingsDialogProps) {
  const [intervalKey, setIntervalKey] = useState(cadence?.interval_key ?? 'quarterly');
  const [anchorRule, setAnchorRule] = useState(cadence?.anchor_rule ?? 'day_of_month');
  const [anchorDay, setAnchorDay] = useState(cadence?.anchor_day ?? 1);
  const [paused, setPaused] = useState(cadence?.paused ?? false);
  const [resumeOn, setResumeOn] = useState(cadence?.resume_on ?? '');
  const [lastContacted, setLastContacted] = useState(cadence?.last_contacted_at ?? '');
  const [notes, setNotes] = useState(cadence?.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIntervalKey(cadence?.interval_key ?? 'quarterly');
    setAnchorRule(cadence?.anchor_rule ?? 'day_of_month');
    setAnchorDay(cadence?.anchor_day ?? 1);
    setPaused(cadence?.paused ?? false);
    setResumeOn(cadence?.resume_on ?? '');
    setLastContacted(cadence?.last_contacted_at ?? '');
    setNotes(cadence?.notes ?? '');
  }, [open, cadence]);

  const preview = computeNextDue({
    interval_key: intervalKey,
    anchor_rule: anchorRule,
    anchor_day: anchorDay,
    paused,
    resume_on: resumeOn || null,
    last_contacted_at: lastContacted || null,
  });

  const submit = async () => {
    setSaving(true);
    const nextDue = preview ? formatDateOnly(preview) : null;
    await onSave(investorId, {
      interval_key: intervalKey,
      anchor_rule: anchorRule,
      anchor_day: anchorDay,
      paused,
      resume_on: resumeOn || null,
      last_contacted_at: lastContacted || null,
      notes: notes || null,
      next_due_at: nextDue,
    } as Partial<InvestorCadence>);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Follow-up rhythm</DialogTitle>
          <DialogDescription>How often should {investorName} hear from us?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>How often</Label>
            <Select value={intervalKey} onValueChange={setIntervalKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CADENCE_INTERVALS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {intervalMonths(intervalKey) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>When in the month</Label>
                  <Select value={anchorRule} onValueChange={setAnchorRule}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ANCHOR_RULES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {anchorRule === 'day_of_month' && (
                  <div className="space-y-1.5">
                    <Label>Day</Label>
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      value={anchorDay}
                      onChange={(e) => setAnchorDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Last time we reached out</Label>
                <Input type="date" value={lastContacted} onChange={(e) => setLastContacted(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Pause for now</p>
                  <p className="text-xs text-muted-foreground">Skip them until the resume date.</p>
                </div>
                <Switch checked={paused} onCheckedChange={setPaused} />
              </div>
              {paused && (
                <div className="space-y-1.5">
                  <Label>Resume on</Label>
                  <Input type="date" value={resumeOn} onChange={(e) => setResumeOn(e.target.value)} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <p className="text-xs text-muted-foreground">
                {preview ? `Next due ${formatDateOnly(preview)}.` : 'No upcoming date.'}
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          {cadence && onClear && (
            <Button
              variant="ghost"
              className="mr-auto text-destructive"
              onClick={async () => {
                await onClear(investorId);
                onOpenChange(false);
              }}
            >
              Remove rhythm
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
