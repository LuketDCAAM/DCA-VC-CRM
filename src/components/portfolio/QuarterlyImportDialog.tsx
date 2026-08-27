import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Download, FileUp, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { comparePeriods, computeStatus, deriveQuarter } from '@/lib/portfolio/metrics';
import type { PortcoQuarter } from '@/hooks/portfolio/usePortcoQuarters';
import type { PortfolioCompany } from '@/hooks/usePortfolioCompanies';

type Kind = 'money' | 'percent' | 'number';

interface Spec {
  column: string;
  field: string;
  kind: Kind;
  target?: boolean;
  hint: string;
}

const SPECS: Spec[] = [
  { column: 'arr', field: 'arr', kind: 'money', hint: 'Annual recurring revenue in dollars' },
  { column: 'revenue', field: 'revenue', kind: 'money', hint: 'Revenue for the quarter in dollars' },
  { column: 'gross_margin_pct', field: 'gross_margin', kind: 'percent', hint: 'e.g. 72.5' },
  { column: 'gross_burn_monthly', field: 'gross_burn', kind: 'money', hint: 'Monthly gross burn in dollars' },
  { column: 'net_burn_monthly', field: 'net_burn', kind: 'money', hint: 'Monthly net burn in dollars' },
  { column: 'cash_balance', field: 'cash_balance', kind: 'money', hint: 'Cash at quarter end in dollars' },
  { column: 'headcount', field: 'headcount', kind: 'number', hint: 'Employees at quarter end' },
  { column: 'customer_count', field: 'customer_count', kind: 'number', hint: 'Customers at quarter end' },
  { column: 'nrr_pct', field: 'nrr', kind: 'percent', hint: 'e.g. 118' },
  { column: 'grr_pct', field: 'grr', kind: 'percent', hint: 'e.g. 94' },
  { column: 'monthly_churn_pct', field: 'monthly_churn', kind: 'percent', hint: 'e.g. 1.2' },
  { column: 'arr_target', field: 'arr', kind: 'money', target: true, hint: 'Plan ARR in dollars (optional)' },
  { column: 'revenue_target', field: 'revenue', kind: 'money', target: true, hint: 'Plan revenue in dollars (optional)' },
];

const TEMPLATE_COLUMNS = ['company_name', 'fiscal_year', 'fiscal_quarter', ...SPECS.map((s) => s.column), 'notes'];

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      row.push(cur);
      cur = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cur = '';
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? '').trim();
    });
    return obj;
  });
}

function toStored(raw: string, kind: Kind): number | null {
  const cleaned = (raw ?? '').replace(/[$,%\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  if (kind === 'money') return Math.round(n * 100);
  if (kind === 'percent') return n / 100;
  return n;
}

interface ParsedRow {
  companyName: string;
  companyId: string | null;
  year: number | null;
  quarter: number | null;
  values: Record<string, number | null>;
  targets: Record<string, number | null>;
  notes: string | null;
  error: string | null;
}

interface Props {
  companies: PortfolioCompany[];
  quartersByCompany: Map<string, PortcoQuarter[]>;
  onImported?: () => void;
}

export function QuarterlyImportDialog({ companies, quartersByCompany, onImported }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const example = [
      companies[0]?.company_name ?? 'Acme Inc',
      String(new Date().getUTCFullYear()),
      String(Math.floor(new Date().getUTCMonth() / 3) + 1),
      '2400000',
      '600000',
      '72.5',
      '180000',
      '140000',
      '3200000',
      '24',
      '48',
      '118',
      '94',
      '1.2',
      '2600000',
      '650000',
      'Optional commentary',
    ];
    const csv = [TEMPLATE_COLUMNS.join(','), example.join(',')].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio-quarterly-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    const byName = new Map(companies.map((c) => [c.company_name.trim().toLowerCase(), c]));

    const mapped: ParsedRow[] = parsed.map((raw) => {
      const companyName = raw['company_name'] ?? '';
      const company = byName.get(companyName.trim().toLowerCase()) ?? null;
      const year = Number(raw['fiscal_year']);
      const quarterRaw = (raw['fiscal_quarter'] ?? '').replace(/^q/i, '');
      const quarter = Number(quarterRaw);

      const values: Record<string, number | null> = {};
      const targets: Record<string, number | null> = {};
      for (const spec of SPECS) {
        const value = toStored(raw[spec.column] ?? '', spec.kind);
        if (value == null) continue;
        if (spec.target) targets[spec.field] = value;
        else values[spec.field] = value;
      }

      let error: string | null = null;
      if (!companyName) error = 'Missing company_name';
      else if (!company) error = `No portfolio company named "${companyName}"`;
      else if (!Number.isInteger(year) || year < 2000 || year > 2100) error = 'Invalid fiscal_year';
      else if (![1, 2, 3, 4].includes(quarter)) error = 'fiscal_quarter must be 1-4';
      else if (!Object.keys(values).length && !Object.keys(targets).length) error = 'No metric values in this row';

      return {
        companyName,
        companyId: company?.id ?? null,
        year: Number.isFinite(year) ? year : null,
        quarter: Number.isFinite(quarter) ? quarter : null,
        values,
        targets,
        notes: raw['notes']?.trim() ? raw['notes'].trim() : null,
        error,
      };
    });

    setFileName(file.name);
    setRows(mapped);
  };

  const valid = rows.filter((r) => !r.error);
  const invalid = rows.filter((r) => r.error);

  const handleImport = async () => {
    if (!valid.length) return;
    setImporting(true);
    try {
      // Group by company so derived metrics and status use the full quarter history.
      const byCompany = new Map<string, ParsedRow[]>();
      valid.forEach((r) => {
        const list = byCompany.get(r.companyId as string);
        if (list) list.push(r);
        else byCompany.set(r.companyId as string, [r]);
      });

      const payloads: Record<string, unknown>[] = [];

      for (const [companyId, incoming] of byCompany) {
        const existing = quartersByCompany.get(companyId) ?? [];
        // Merge incoming rows into the known history (incoming wins per period).
        const merged: PortcoQuarter[] = existing.map((q) => ({ ...q }));
        for (const row of incoming) {
          const idx = merged.findIndex((q) => q.fiscal_year === row.year && q.fiscal_quarter === row.quarter);
          const base =
            idx >= 0
              ? merged[idx]
              : ({
                  id: 'draft',
                  portfolio_company_id: companyId,
                  fiscal_year: row.year as number,
                  fiscal_quarter: row.quarter as number,
                  custom_metrics: {},
                  targets: {},
                  computed: {},
                } as PortcoQuarter);
          const next = {
            ...base,
            ...row.values,
            targets: { ...(base.targets ?? {}), ...row.targets },
            notes: row.notes ?? base.notes ?? null,
          } as PortcoQuarter;
          if (idx >= 0) merged[idx] = next;
          else merged.push(next);
        }
        merged.sort(comparePeriods);

        for (const row of incoming) {
          const target = merged.find((q) => q.fiscal_year === row.year && q.fiscal_quarter === row.quarter);
          if (!target) continue;
          const idx = merged.indexOf(target);
          const prior = idx > 0 ? merged[idx - 1] : undefined;
          const yearAgo = merged.find(
            (q) => q.fiscal_year === target.fiscal_year - 1 && q.fiscal_quarter === target.fiscal_quarter,
          );
          const derived = deriveQuarter(target, prior, yearAgo);
          const status = computeStatus(derived);

          payloads.push({
            portfolio_company_id: companyId,
            fiscal_year: target.fiscal_year,
            fiscal_quarter: target.fiscal_quarter,
            revenue: target.revenue ?? null,
            arr: target.arr ?? null,
            gross_margin: target.gross_margin ?? null,
            gross_burn: target.gross_burn ?? null,
            net_burn: target.net_burn ?? null,
            cash_balance: target.cash_balance ?? null,
            headcount: target.headcount ?? null,
            nrr: target.nrr ?? null,
            grr: target.grr ?? null,
            monthly_churn: target.monthly_churn ?? null,
            customer_count: target.customer_count ?? null,
            custom_metrics: target.custom_metrics ?? {},
            targets: target.targets ?? {},
            computed: { ...derived, status_reasons: status.reasons },
            performance_status: status.status,
            status_override: target.status_override ?? null,
            status_reason: target.status_reason ?? null,
            notes: target.notes ?? null,
          });
        }
      }

      const { error } = await supabase
        .from('portco_quarterly_metrics')
        .upsert(payloads as never, { onConflict: 'portfolio_company_id,fiscal_year,fiscal_quarter' });
      if (error) throw error;

      toast({
        title: 'Financials imported',
        description: `${payloads.length} quarter${payloads.length === 1 ? '' : 's'} saved across ${byCompany.size} compan${byCompany.size === 1 ? 'y' : 'ies'}.`,
      });
      onImported?.();
      reset();
      setOpen(false);
    } catch (e) {
      toast({ title: 'Import failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" />
          Import financials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import quarterly financials</DialogTitle>
          <DialogDescription>
            One row per company per quarter. Enter dollars (not cents) and percentages as plain numbers (72.5 = 72.5%).
            Existing quarters are updated; blank cells are left untouched only for new metrics you omit entirely.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" />
            Download template
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            <FileUp className="h-4 w-4 mr-1" />
            {fileName || 'Choose CSV file'}
          </Button>
        </div>

        <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Columns</p>
          <p>company_name, fiscal_year, fiscal_quarter (1-4), notes</p>
          <p>{SPECS.map((s) => s.column).join(', ')}</p>
        </div>

        {invalid.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {invalid.length} row{invalid.length === 1 ? '' : 's'} will be skipped:{' '}
              {invalid
                .slice(0, 4)
                .map((r) => `${r.companyName || 'row'} — ${r.error}`)
                .join('; ')}
              {invalid.length > 4 ? '…' : ''}
            </AlertDescription>
          </Alert>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto max-h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Metrics</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r, i) => (
                  <TableRow key={`${r.companyName}-${r.year}-${r.quarter}-${i}`}>
                    <TableCell className="whitespace-nowrap">{r.companyName || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.year && r.quarter ? `${r.year}Q${r.quarter}` : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Object.keys(r.values).length + Object.keys(r.targets).length}
                    </TableCell>
                    <TableCell className={r.error ? 'text-destructive text-xs' : 'text-emerald-600 text-xs'}>
                      {r.error ?? 'Ready'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!valid.length || importing}>
            {importing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Import {valid.length ? `${valid.length} row${valid.length === 1 ? '' : 's'}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
