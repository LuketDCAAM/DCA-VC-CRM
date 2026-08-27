import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CORE_KPI_FIELDS, toEditable, toStored, type KpiUnit } from '@/lib/portfolio/kpiFields';
import { currentQuarter } from '@/lib/portfolio/metrics';
import type { CustomKpiDefinition, PortcoQuarter, QuarterValues } from '@/hooks/portfolio/usePortcoQuarters';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quarter: PortcoQuarter | null;
  definitions: CustomKpiDefinition[];
  saving: boolean;
  onSave: (year: number, quarter: number, values: QuarterValues) => Promise<boolean>;
}

const STATUS_OPTIONS = ['auto', 'On Track', 'Watch', 'At Risk'];

export function PortcoQuarterForm({ open, onOpenChange, quarter, definitions, saving, onSave }: Props) {
  const initialPeriod = quarter ?? currentQuarter();
  const [year, setYear] = useState(String(initialPeriod.fiscal_year));
  const [fq, setFq] = useState(String(initialPeriod.fiscal_quarter));
  const [core, setCore] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      CORE_KPI_FIELDS.map((f) => [f.key, toEditable((quarter as never)?.[f.key] as number | null, f.unit)]),
    ),
  );
  const [targets, setTargets] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      CORE_KPI_FIELDS.filter((f) => f.targetable).map((f) => [
        f.key,
        toEditable(quarter?.targets?.[f.key] ?? null, f.unit),
      ]),
    ),
  );
  const [custom, setCustom] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      definitions.map((d) => [d.key, toEditable(quarter?.custom_metrics?.[d.key] ?? null, d.unit)]),
    ),
  );
  const [statusOverride, setStatusOverride] = useState(quarter?.status_override ?? 'auto');
  const [statusReason, setStatusReason] = useState(quarter?.status_reason ?? '');
  const [notes, setNotes] = useState(quarter?.notes ?? '');
  const [markDate, setMarkDate] = useState(quarter?.mark_date ?? '');
  const [companyValuation, setCompanyValuation] = useState(toEditable(quarter?.company_valuation ?? null, 'money'));
  const [ownershipPct, setOwnershipPct] = useState(toEditable(quarter?.ownership_pct ?? null, 'percent'));
  const [ourFmv, setOurFmv] = useState(toEditable(quarter?.our_fmv ?? null, 'money'));
  const [markMethod, setMarkMethod] = useState(quarter?.mark_method ?? 'none');


  const heading = useMemo(() => (quarter ? `Edit ${quarter.fiscal_year}Q${quarter.fiscal_quarter}` : 'Add quarter'), [quarter]);

  const submit = async () => {
    const values: QuarterValues = {
      custom_metrics: Object.fromEntries(
        definitions.map((d) => [d.key, toStored(custom[d.key] ?? '', d.unit as KpiUnit)]),
      ),
      targets: Object.fromEntries(
        CORE_KPI_FIELDS.filter((f) => f.targetable).map((f) => [f.key, toStored(targets[f.key] ?? '', f.unit)]),
      ),
      status_override: statusOverride === 'auto' ? null : statusOverride,
      status_reason: statusReason.trim() || null,
      notes: notes.trim() || null,
    };
    CORE_KPI_FIELDS.forEach((f) => {
      (values as Record<string, unknown>)[f.key] = toStored(core[f.key] ?? '', f.unit);
    });

    const ok = await onSave(Number(year), Number(fq), values);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fiscal year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={!!quarter}
              />
            </div>
            <div>
              <Label>Quarter</Label>
              <Select value={fq} onValueChange={setFq} disabled={!!quarter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((q) => (
                    <SelectItem key={q} value={String(q)}>
                      Q{q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Core metrics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CORE_KPI_FIELDS.map((f) => (
                <div key={f.key}>
                  <Label className="text-xs">
                    {f.label}
                    {f.unit === 'money' ? ' ($)' : f.unit === 'percent' ? ' (%)' : ''}
                  </Label>
                  <Input
                    inputMode="decimal"
                    value={core[f.key] ?? ''}
                    onChange={(e) => setCore((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Plan / targets</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CORE_KPI_FIELDS.filter((f) => f.targetable).map((f) => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label} target</Label>
                  <Input
                    inputMode="decimal"
                    value={targets[f.key] ?? ''}
                    onChange={(e) => setTargets((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {definitions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Custom KPIs</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {definitions.map((d) => (
                  <div key={d.id}>
                    <Label className="text-xs">
                      {d.label}
                      {d.unit === 'money' ? ' ($)' : d.unit === 'percent' ? ' (%)' : ''}
                    </Label>
                    <Input
                      inputMode="decimal"
                      value={custom[d.key] ?? ''}
                      onChange={(e) => setCustom((prev) => ({ ...prev, [d.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusOverride} onValueChange={setStatusOverride}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'auto' ? 'Auto (computed)' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status reason</Label>
              <Input value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Save quarter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
