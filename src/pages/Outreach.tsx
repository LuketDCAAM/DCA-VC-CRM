import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FollowUpCard } from '@/components/outreach/FollowUpCard';
import { FollowUpDialog } from '@/components/outreach/FollowUpDialog';
import { DigestBuilderDialog } from '@/components/outreach/DigestBuilderDialog';
import { DigestBatchView } from '@/components/outreach/DigestBatchView';
import { CadenceOverviewPanel } from '@/components/outreach/CadenceOverviewPanel';
import { useFollowUps, type FollowUp } from '@/hooks/outreach/useFollowUps';
import { useOutreachBatches } from '@/hooks/outreach/useOutreachBatches';
import { useOutreachDraft } from '@/hooks/outreach/useOutreachDraft';
import { useInvestorCadences } from '@/hooks/outreach/useInvestorCadences';
import { useInvestorsSimple } from '@/hooks/useInvestorsSimple';
import { useOptimizedDeals } from '@/hooks/useOptimizedDeals';
import { useOutlookAppUser } from '@/hooks/useOutlookAppUser';
import { formatDateOnly } from '@/lib/outreach/constants';
import { Loader2, Mail, Plus, Send } from 'lucide-react';

export default function Outreach() {
  const { followUps, loading, createFollowUp, updateFollowUp, deleteFollowUp, refetch } = useFollowUps();
  const { batches, items, createBatch, updateItem, deleteItem, deleteBatch, refetch: refetchBatches } = useOutreachBatches();
  const { generate, pushToOutlook, busyId } = useOutreachDraft();
  const { dueInMonth } = useInvestorCadences();
  const { investors } = useInvestorsSimple();
  const { deals } = useOptimizedDeals();
  const { connected: outlookConnected } = useOutlookAppUser();

  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);

  const today = formatDateOnly(new Date());
  const dealById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);
  const investorById = useMemo(() => new Map(investors.map((i) => [i.id, i])), [investors]);

  const groups = useMemo(() => {
    const dueNow: FollowUp[] = [];
    const upcoming: FollowUp[] = [];
    const drafted: FollowUp[] = [];
    const sent: FollowUp[] = [];
    const snoozed: FollowUp[] = [];
    followUps.forEach((f) => {
      if (f.status === 'sent' || f.status === 'done') sent.push(f);
      else if (f.status === 'snoozed' && f.snooze_until && f.snooze_until > today) snoozed.push(f);
      else if (f.subject) drafted.push(f);
      else if (f.due_date <= today) dueNow.push(f);
      else upcoming.push(f);
    });
    return { dueNow, upcoming, drafted, sent, snoozed };
  }, [followUps, today]);

  const describe = (f: FollowUp) => {
    const deal = f.deal_id ? dealById.get(f.deal_id) : null;
    const investor = f.investor_id ? investorById.get(f.investor_id) : null;
    const title = deal?.company_name || investor?.contact_name || f.contact_name || 'Follow-up';
    const subtitle = investor?.firm_name || deal?.sector || null;
    const email = f.contact_email || deal?.contact_email || investor?.contact_email || null;
    return { title, subtitle, email };
  };

  const renderList = (list: FollowUp[], empty: string) => {
    if (!list.length) return <p className="text-sm text-muted-foreground py-6 text-center">{empty}</p>;
    return (
      <div className="space-y-2">
        {list.map((f) => {
          const { title, subtitle, email } = describe(f);
          return (
            <FollowUpCard
              key={f.id}
              followUp={f}
              title={title}
              subtitle={subtitle}
              recipientEmail={email}
              outlookConnected={outlookConnected}
              busy={busyId === f.id}
              onGenerate={async (note) => {
                await generate('follow_up', f.id, note);
                refetch();
              }}
              onUpdate={(updates, silent) => updateFollowUp(f.id, updates, silent)}
              onPushToOutlook={async () => {
                await pushToOutlook('follow_up', f.id);
                refetch();
              }}
              onDelete={() => deleteFollowUp(f.id)}
            />
          );
        })}
      </div>
    );
  };

  const dueInvestorIds = useMemo(() => dueInMonth(new Date()), [dueInMonth]);

  const generateAll = async (itemIds: string[]) => {
    for (const id of itemIds) {
      await generate('batch_item', id);
    }
    refetchBatches();
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Outreach</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Follow-ups with founders and monthly notes to investors, drafted for you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setDigestOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            New investor note
          </Button>
          <Button onClick={() => setFollowUpOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule follow-up
          </Button>
        </div>
      </div>

      {!outlookConnected && (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Your Outlook isn't connected yet, so drafts stay here — copy them or open them in your email app. Once
            Outlook is approved they'll land straight in your Drafts folder.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="due">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="due">Due now ({groups.dueNow.length})</TabsTrigger>
          <TabsTrigger value="drafted">Drafts ready ({groups.drafted.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({groups.upcoming.length})</TabsTrigger>
          <TabsTrigger value="digests">Investor notes ({batches.length})</TabsTrigger>
          <TabsTrigger value="cadence">Rhythm</TabsTrigger>
          <TabsTrigger value="done">Sent ({groups.sent.length})</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="due" className="mt-4">
              {renderList(groups.dueNow, 'Nothing due today. Nice.')}
            </TabsContent>
            <TabsContent value="drafted" className="mt-4">
              {renderList(groups.drafted, 'No drafts waiting for review.')}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4">
              {renderList(groups.upcoming, 'Nothing scheduled ahead.')}
              {groups.snoozed.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Snoozed</h3>
                  {renderList(groups.snoozed, '')}
                </div>
              )}
            </TabsContent>
            <TabsContent value="digests" className="mt-4 space-y-4">
              {batches.map((batch) => (
                <DigestBatchView
                  key={batch.id}
                  batch={batch}
                  items={items.filter((i) => i.batch_id === batch.id)}
                  investors={investors}
                  deals={deals}
                  outlookConnected={outlookConnected}
                  busyId={busyId}
                  onGenerate={async (itemId, note) => {
                    await generate('batch_item', itemId, note);
                    refetchBatches();
                  }}
                  onGenerateAll={generateAll}
                  onUpdateItem={updateItem}
                  onPushToOutlook={async (itemId) => {
                    await pushToOutlook('batch_item', itemId);
                    refetchBatches();
                  }}
                  onDeleteItem={deleteItem}
                  onDeleteBatch={() => deleteBatch(batch.id)}
                />
              ))}
              {!batches.length && (
                <Card>
                  <CardContent className="py-10 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No investor notes yet. Pick the investors due this month and we'll suggest deals for each of them.
                    </p>
                    <Button onClick={() => setDigestOpen(true)}>Build this month's note</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="cadence" className="mt-4">
              <CadenceOverviewPanel investors={investors} />
            </TabsContent>
            <TabsContent value="done" className="mt-4">
              {renderList(groups.sent, 'Nothing sent yet.')}
            </TabsContent>
          </>
        )}
      </Tabs>

      <FollowUpDialog open={followUpOpen} onOpenChange={setFollowUpOpen} onCreate={createFollowUp} />
      <DigestBuilderDialog
        open={digestOpen}
        onOpenChange={setDigestOpen}
        investors={investors}
        deals={deals}
        dueInvestorIds={dueInvestorIds}
        onCreate={createBatch}
      />
    </div>
  );
}
