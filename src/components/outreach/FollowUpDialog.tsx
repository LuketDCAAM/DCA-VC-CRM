import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useTeamProfiles } from '@/hooks/outreach/useTeamProfiles';
import { FOLLOW_UP_PURPOSES, formatDateOnly } from '@/lib/outreach/constants';
import type { NewFollowUp } from '@/hooks/outreach/useFollowUps';

interface FollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewFollowUp) => Promise<unknown>;
  dealId?: string | null;
  investorId?: string | null;
  defaultContactName?: string | null;
  defaultContactEmail?: string | null;
  entityLabel?: string;
}

export function FollowUpDialog({
  open,
  onOpenChange,
  onCreate,
  dealId,
  investorId,
  defaultContactName,
  defaultContactEmail,
  entityLabel,
}: FollowUpDialogProps) {
  const { user } = useAuth();
  const { profiles } = useTeamProfiles();

  const [purpose, setPurpose] = useState('check_in');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDateOnly(d);
  });
  const [ownerId, setOwnerId] = useState(user?.id ?? '');
  const [contactName, setContactName] = useState(defaultContactName ?? '');
  const [contactEmail, setContactEmail] = useState(defaultContactEmail ?? '');
  const [context, setContext] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setOwnerId(user?.id ?? '');
      setContactName(defaultContactName ?? '');
      setContactEmail(defaultContactEmail ?? '');
      setContext('');
    }
  }, [open, user?.id, defaultContactName, defaultContactEmail]);

  const submit = async () => {
    if (!dueDate || !ownerId) return;
    setSaving(true);
    const created = await onCreate({
      deal_id: dealId ?? null,
      investor_id: investorId ?? null,
      purpose,
      due_date: dueDate,
      owner_id: ownerId,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      context: context || null,
    });
    setSaving(false);
    if (created) onOpenChange(false);
  };

  const hint = FOLLOW_UP_PURPOSES.find((p) => p.value === purpose)?.hint;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule a follow-up</DialogTitle>
          <DialogDescription>
            {entityLabel ? `For ${entityLabel}. ` : ''}On the due date the draft is written for whoever owns it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue placeholder="Assign to" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contact name</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact email</Label>
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Anything the email should mention?</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="Ask for updated ARR and the hiring plan we discussed."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !dueDate || !ownerId}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
