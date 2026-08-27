import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePortcoQuarters, resolveStatus } from '@/hooks/portfolio/usePortcoQuarters';
import type { PortcoQuarter } from '@/hooks/portfolio/usePortcoQuarters';
import { CORE_KPI_FIELDS, type KpiUnit } from '@/lib/portfolio/kpiFields';
import { formatMoney, formatNumber, formatPercent, comparePeriods } from '@/lib/portfolio/metrics';
import { PerformanceStatusBadge } from './PerformanceStatusBadge';
import { PortcoQuarterForm } from './PortcoQuarterForm';

function formatByUnit(value: number | null | undefined, unit: KpiUnit) {
  if (unit === 'money') return formatMoney(value);
  if (unit === 'percent') return formatPercent(value);
  return formatNumber(value);
}

interface Props {
  companyId: string;
}

export function PortcoKpiPanel({ companyId }: Props) {
  const {
    quarters,
    definitions,
    loading,
    saving,
    saveQuarter,
    deleteQuarter,
    addDefinition,
    removeDefinition,
  } = usePortcoQuarters(companyId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PortcoQuarter | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newUnit, setNewUnit] = useState<KpiUnit>('number');

  const sorted = [...quarters].sort(comparePeriods).reverse();

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (q: PortcoQuarter) => {
    setEditing(q);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quarterly KPIs</h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add quarter
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading KPIs...</p>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quarters recorded yet. Add one to start tracking performance.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  {CORE_KPI_FIELDS.map((f) => (
                    <TableHead key={f.key} className="text-right whitespace-nowrap">
                      {f.label}
                    </TableHead>
                  ))}
                  {definitions.map((d) => (
                    <TableHead key={d.id} className="text-right whitespace-nowrap">
                      {d.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Runway</TableHead>
                  <TableHead className="text-right">ARR QoQ</TableHead>
                  <TableHead className="text-right">vs Plan</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((q) => {
                  const computed = (q.computed ?? {}) as Record<string, number | null> & {
                    status_reasons?: string[];
                  };
                  const reasons = (computed.status_reasons as unknown as string[]) ?? [];
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {q.fiscal_year}Q{q.fiscal_quarter}
                      </TableCell>
                      <TableCell>
                        <PerformanceStatusBadge
                          status={resolveStatus(q)}
                          reasons={q.status_reason ? [q.status_reason, ...reasons] : reasons}
                          overridden={!!q.status_override}
                        />
                      </TableCell>
                      {CORE_KPI_FIELDS.map((f) => (
                        <TableCell key={f.key} className="text-right tabular-nums whitespace-nowrap">
                          {formatByUnit((q as unknown as Record<string, number | null>)[f.key], f.unit)}
                        </TableCell>
                      ))}
                      {definitions.map((d) => (
                        <TableCell key={d.id} className="text-right tabular-nums whitespace-nowrap">
                          {formatByUnit(q.custom_metrics?.[d.key] ?? null, d.unit)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right tabular-nums">
                        {computed.runway != null ? `${computed.runway.toFixed(1)} mo` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(computed.arrQoQ)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(computed.arrVariance)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteQuarter(q.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Custom KPIs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {definitions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {definitions.map((d) => (
                <div key={d.id} className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
                  <span>{d.label}</span>
                  <span className="text-xs text-muted-foreground">({d.unit})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => removeDefinition(d.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <Label className="text-xs">KPI name</Label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Active clinics" />
            </div>
            <div className="w-full sm:w-40">
              <Label className="text-xs">Unit</Label>
              <Select value={newUnit} onValueChange={(v) => setNewUnit(v as KpiUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="money">Money</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={async () => {
                const ok = await addDefinition({ label: newLabel, unit: newUnit, higher_is_better: true });
                if (ok) setNewLabel('');
              }}
              disabled={!newLabel.trim()}
            >
              Add KPI
            </Button>
          </div>
        </CardContent>
      </Card>

      {formOpen && (
        <PortcoQuarterForm
          key={editing?.id ?? 'new'}
          open={formOpen}
          onOpenChange={setFormOpen}
          quarter={editing}
          definitions={definitions}
          saving={saving}
          onSave={saveQuarter}
        />
      )}
    </div>
  );
}
