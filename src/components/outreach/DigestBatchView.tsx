import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DraftEditor } from './DraftEditor';
import { useTeamProfiles } from '@/hooks/outreach/useTeamProfiles';
import type { OutreachBatch, OutreachBatchItem } from '@/hooks/outreach/useOutreachBatches';
import type { Investor } from '@/types/investor';
import type { Deal } from '@/types/deal';
import { ChevronDown, ChevronUp, Loader2, Sparkles, Trash2 } from 'lucide-react';

interface DigestBatchViewProps {
  batch: OutreachBatch;
  items: OutreachBatchItem[];
  investors: Investor[];
  deals: Deal[];
  outlookConnected: boolean;
  busyId: string | null;
  onGenerate: (itemId: string, note?: string) => void;
  onGenerateAll: (itemIds: string[]) => void;
  onUpdateItem: (id: string, updates: Partial<OutreachBatchItem>, silent?: boolean) => void;
  onPushToOutlook: (itemId: string) => void;
  onDeleteItem: (id: string) => void;
  onDeleteBatch: () => void;
}

export function DigestBatchView({
  batch,
  items,
  investors,
  deals,
  outlookConnected,
  busyId,
  onGenerate,
  onGenerateAll,
  onUpdateItem,
  onPushToOutlook,
  onDeleteItem,
  onDeleteBatch,
}: DigestBatchViewProps) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const { profiles, label } = useTeamProfiles();

  const investorById = new Map(investors.map((i) => [i.id, i]));
  const dealById = new Map(deals.map((d) => [d.id, d]));
  const undrafted = items.filter((i) => !i.subject).map((i) => i.id);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{batch.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {items.length} investor{items.length === 1 ? '' : 's'} · {items.filter((i) => i.status === 'sent').length} sent
            </p>
          </div>
          <div className="flex items-center gap-2">
            {undrafted.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => onGenerateAll(undrafted)} disabled={!!busyId}>
                {busyId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Draft all ({undrafted.length})
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-destructive" onClick={onDeleteBatch}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const investor = investorById.get(item.investor_id);
          const expanded = openItem === item.id;
          return (
            <div key={item.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{investor?.contact_name ?? 'Investor'}</span>
                    {investor?.firm_name && <span className="text-xs text-muted-foreground">{investor.firm_name}</span>}
                    <Badge variant={item.status === 'sent' ? 'secondary' : 'outline'} className="text-xs">
                      {item.status === 'drafted' ? 'Draft ready' : item.status === 'sent' ? 'Sent' : 'Proposed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(item.deal_ids as string[]).map((id) => dealById.get(id)?.company_name ?? 'Deal').join(' · ')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Owner: {label(item.owner_id)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpenItem(expanded ? null : item.id)}>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {expanded && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <Select value={item.owner_id} onValueChange={(v) => onUpdateItem(item.id, { owner_id: v })}>
                      <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name || p.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <DraftEditor
                    subject={item.subject}
                    body={item.body}
                    recipientEmail={investor?.contact_email}
                    syncStatus={item.sync_status}
                    syncError={item.sync_error}
                    webLink={item.outlook_web_link}
                    outlookConnected={outlookConnected}
                    busy={busyId === item.id}
                    onGenerate={(note) => onGenerate(item.id, note)}
                    onSave={(subject, body) => onUpdateItem(item.id, { subject, body })}
                    onPushToOutlook={() => onPushToOutlook(item.id)}
                    onMarkSent={() => onUpdateItem(item.id, { status: 'sent', sent_at: new Date().toISOString() })}
                  />
                </div>
              )}
            </div>
          );
        })}
        {!items.length && <p className="text-sm text-muted-foreground">No investors in this digest.</p>}
      </CardContent>
    </Card>
  );
}
