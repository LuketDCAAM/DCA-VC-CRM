import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CadenceSettingsDialog } from './CadenceSettingsDialog';
import type { usePortcoCadences } from '@/hooks/outreach/usePortcoCadences';
import { useDealContactsByCompany } from '@/hooks/portfolio/useDealContactsByCompany';
import { useAllPortcoQuarters } from '@/hooks/portfolio/useAllPortcoQuarters';
import type { PortfolioCompany } from '@/hooks/usePortfolioCompanies';
import { CADENCE_BUCKET_LABELS, intervalLabel } from '@/lib/outreach/constants';
import { assistSignals, type AssistSignal } from '@/lib/portfolio/assistSignals';
import { Building2, Loader2, PenLine, Settings2 } from 'lucide-react';

interface PortcoCadencePanelProps {
  companies: PortfolioCompany[];
  cadences: ReturnType<typeof usePortcoCadences>;
  /** Create a check-in follow-up and draft it. */
  onDraftCheckIn: (args: {
    companyId: string;
    contactName: string | null;
    contactEmail: string | null;
    signals: AssistSignal[];
  }) => Promise<void>;
}

const BUCKET_ORDER = { overdue: 0, due: 1, upcoming: 2, paused: 3, none: 4 } as const;

/** Check-in rhythm for portfolio companies, with "where we can help" flags from their numbers. */
export function PortcoCadencePanel({ companies, cadences, onDraftCheckIn }: PortcoCadencePanelProps) {
  const { byCompany, saveCadence, clearCadence } = cadences;
  const { byCompany: quartersByCompany } = useAllPortcoQuarters();
  const { lookup: lookupDealContact } = useDealContactsByCompany();
  const [editing, setEditing] = useState<PortfolioCompany | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      companies
        .filter((c) => c.status === 'Active')
        .map((c) => ({
          company: c,
          view: byCompany.get(c.id) ?? null,
          contact: (() => {
            const v = byCompany.get(c.id);
            const d = lookupDealContact(c.company_name);
            return { name: v?.contact_name || d?.name || null, email: v?.contact_email || d?.email || null };
          })(),
          signals: assistSignals(quartersByCompany.get(c.id) ?? []),
        }))
        .sort((a, b) => {
          const ba = a.view ? BUCKET_ORDER[a.view.bucket] : 5;
          const bb = b.view ? BUCKET_ORDER[b.view.bucket] : 5;
          if (ba !== bb) return ba - bb;
          return (a.view?.next_due ?? '9999').localeCompare(b.view?.next_due ?? '9999') ||
            a.company.company_name.localeCompare(b.company.company_name);
        }),
    [companies, byCompany, quartersByCompany, lookupDealContact],
  );

  const overdue = rows.filter((r) => r.view?.bucket === 'overdue').length;
  const due = rows.filter((r) => r.view?.bucket === 'due').length;
  const unset = rows.filter((r) => !r.view).length;
  const flagged = rows.filter((r) => r.signals.some((s) => s.level !== 'info')).length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Portfolio check-ins
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {overdue} overdue · {due} due this month · {flagged} could use help · {unset} with no rhythm set
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map(({ company, view, contact, signals }) => (
            <div key={company.id} className="rounded-md border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{company.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {view
                      ? `${intervalLabel(view.interval_key)}${view.next_due ? ` · next ${view.next_due}` : ''}${
                          contact.name ? ` · ${contact.name}` : ''
                        }`
                      : 'No rhythm set'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {view && (
                    <Badge
                      variant={view.bucket === 'overdue' ? 'destructive' : view.bucket === 'due' ? 'secondary' : 'outline'}
                    >
                      {CADENCE_BUCKET_LABELS[view.bucket]}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === company.id}
                    onClick={async () => {
                      setBusy(company.id);
                      try {
                        await onDraftCheckIn({
                          companyId: company.id,
                          contactName: contact.name,
                          contactEmail: contact.email,
                          signals,
                        });
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === company.id ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <PenLine className="h-4 w-4 mr-1.5" />
                    )}
                    Draft check-in
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(company)} aria-label="Set rhythm">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {signals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {signals.map((s) => (
                    <Badge
                      key={s.key}
                      variant={s.level === 'risk' ? 'destructive' : s.level === 'watch' ? 'secondary' : 'outline'}
                      title={s.offer}
                      className="font-normal"
                    >
                      {s.label} — {s.offer.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!rows.length && <p className="text-sm text-muted-foreground">No active portfolio companies.</p>}
        </CardContent>
      </Card>

      {editing && (
        <CadenceSettingsDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          investorId={editing.id}
          investorName={editing.company_name}
          title="Check-in rhythm"
          description={`How often should we check in with ${editing.company_name}?`}
          showContact
          defaultContactName={lookupDealContact(editing.company_name)?.name}
          defaultContactEmail={lookupDealContact(editing.company_name)?.email}
          cadence={byCompany.get(editing.id) ?? null}
          onSave={saveCadence}
          onClear={clearCadence}
        />
      )}
    </>
  );
}
