import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DraftEditor } from './DraftEditor';
import { FOLLOW_UP_STATUS_LABELS, formatDateOnly, purposeLabel, type FollowUpStatus } from '@/lib/outreach/constants';
import { useTeamProfiles } from '@/hooks/outreach/useTeamProfiles';
import type { FollowUp } from '@/hooks/outreach/useFollowUps';
import { CalendarClock, ChevronDown, ChevronUp, Trash2, User } from 'lucide-react';

interface FollowUpCardProps {
  followUp: FollowUp;
  title: string;
  subtitle?: string | null;
  recipientEmail?: string | null;
  outlookConnected: boolean;
  busy: boolean;
  onGenerate: (note?: string) => void;
  onUpdate: (updates: Partial<FollowUp>, silent?: boolean) => void;
  onPushToOutlook: () => void;
  onDelete: () => void;
}

export function FollowUpCard({
  followUp,
  title,
  subtitle,
  recipientEmail,
  outlookConnected,
  busy,
  onGenerate,
  onUpdate,
  onPushToOutlook,
  onDelete,
}: FollowUpCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const { profiles, label } = useTeamProfiles();

  const today = formatDateOnly(new Date());
  const overdue = followUp.due_date < today && followUp.status !== 'sent' && followUp.status !== 'done';
  const status = (followUp.status || 'scheduled') as FollowUpStatus;

  return (
    <Card className={overdue ? 'border-destructive/40' : undefined}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{title}</span>
              <Badge variant="outline">{purposeLabel(followUp.purpose)}</Badge>
              <Badge variant={status === 'sent' ? 'secondary' : 'outline'}>
                {FOLLOW_UP_STATUS_LABELS[status] ?? status}
              </Badge>
              {overdue && <Badge variant="destructive">Overdue</Badge>}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Due {followUp.due_date}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {label(followUp.owner_id)}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="space-y-4 pt-2 border-t">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={followUp.owner_id} onValueChange={(v) => onUpdate({ owner_id: v })}>
                <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="h-8 w-[150px] text-xs"
                value={followUp.due_date}
                onChange={(e) => onUpdate({ due_date: e.target.value }, true)}
              />
              {snoozeOpen ? (
                <Input
                  type="date"
                  className="h-8 w-[150px] text-xs"
                  onChange={(e) => {
                    onUpdate({ snooze_until: e.target.value, status: 'snoozed' });
                    setSnoozeOpen(false);
                  }}
                />
              ) : (
                <Button variant="outline" size="sm" onClick={() => setSnoozeOpen(true)}>Snooze</Button>
              )}
              <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {followUp.context && (
              <p className="text-xs text-muted-foreground italic">Note: {followUp.context}</p>
            )}

            <DraftEditor
              subject={followUp.subject}
              body={followUp.body}
              recipientEmail={recipientEmail ?? followUp.contact_email}
              syncStatus={followUp.sync_status}
              syncError={followUp.sync_error}
              webLink={followUp.outlook_web_link}
              outlookConnected={outlookConnected}
              busy={busy}
              onGenerate={onGenerate}
              onSave={(subject, body) => onUpdate({ subject, body })}
              onPushToOutlook={onPushToOutlook}
              onMarkSent={() => onUpdate({ status: 'sent', sent_at: new Date().toISOString() })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
