import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CadenceSettingsDialog } from './CadenceSettingsDialog';
import { useInvestorCadences } from '@/hooks/outreach/useInvestorCadences';
import { CADENCE_BUCKET_LABELS, intervalLabel } from '@/lib/outreach/constants';
import type { Investor } from '@/types/investor';
import { CalendarClock, Settings2 } from 'lucide-react';

interface CadenceOverviewPanelProps {
  investors: Investor[];
}

/** Shows who is overdue or due soon, and lets the rhythm be set per investor. */
export function CadenceOverviewPanel({ investors }: CadenceOverviewPanelProps) {
  const { views, byInvestor, saveCadence, clearCadence } = useInvestorCadences();
  const [editing, setEditing] = useState<Investor | null>(null);

  const rows = useMemo(() => {
    const nameById = new Map(investors.map((i) => [i.id, i]));
    return views
      .filter((v) => nameById.has(v.investor_id) && v.bucket !== 'none')
      .map((v) => ({ view: v, investor: nameById.get(v.investor_id)! }))
      .sort((a, b) => (a.view.next_due ?? '9999').localeCompare(b.view.next_due ?? '9999'));
  }, [views, investors]);

  const overdue = rows.filter((r) => r.view.bucket === 'overdue');
  const dueSoon = rows.filter((r) => r.view.bucket === 'due' || r.view.bucket === 'upcoming');
  const withoutCadence = investors.filter((i) => !byInvestor.has(i.id));

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Follow-up rhythm
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {overdue.length} overdue · {dueSoon.length} due soon · {withoutCadence.length} with no rhythm set
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.slice(0, 12).map(({ view, investor }) => (
            <div key={view.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {investor.contact_name}
                  {investor.firm_name && <span className="text-muted-foreground font-normal"> · {investor.firm_name}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {intervalLabel(view.interval_key)}
                  {view.next_due ? ` · next ${view.next_due}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={
                    view.bucket === 'overdue' ? 'destructive' : view.bucket === 'due' ? 'secondary' : 'outline'
                  }
                >
                  {CADENCE_BUCKET_LABELS[view.bucket]}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditing(investor)}>
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {!rows.length && (
            <p className="text-sm text-muted-foreground">
              No rhythms set yet. Open an investor to choose how often you want to reach out.
            </p>
          )}
        </CardContent>
      </Card>

      {editing && (
        <CadenceSettingsDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          investorId={editing.id}
          investorName={editing.contact_name}
          cadence={byInvestor.get(editing.id) ?? null}
          onSave={saveCadence}
          onClear={clearCadence}
        />
      )}
    </>
  );
}
