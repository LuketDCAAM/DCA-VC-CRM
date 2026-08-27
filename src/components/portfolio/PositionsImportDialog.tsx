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
import {
  POSITION_STATUSES,
  VEHICLES,
  type PortfolioVehicle,
  type PositionStatus,
} from '@/hooks/portfolio/usePortfolioPositions';
import type { PortfolioCompany } from '@/hooks/usePortfolioCompanies';

const TEMPLATE_COLUMNS = [
  'company_name',
  'sector',
  'stage',
  'vehicle',
  'position_status',
  'first_investment_date',
  'last_investment_date',
  'current_fmv',
  'realized_proceeds',
  'ownership_pct',
  'notes',
];

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

const toCents = (raw: string): number | null => {
  const cleaned = (raw ?? '').replace(/[$,\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

const toDate = (raw: string): string | null => {
  const v = (raw ?? '').trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

interface ParsedRow {
  companyName: string;
  companyId: string | null;
  payload: Record<string, unknown>;
  error: string | null;
}

interface Props {
  companies: PortfolioCompany[];
  onImported?: () => void;
}

export function PositionsImportDialog({ companies, onImported }: Props) {
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
      'Fintech',
      'Seed',
      'Balance Sheet',
      'Active',
      '2024-03-15',
      '2025-06-01',
      '4500000',
      '0',
      '8.5',
      'Optional notes',
    ];
    const csv = [TEMPLATE_COLUMNS.join(','), example.join(',')].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio-positions-template.csv';
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

      const vehicleRaw = (raw['vehicle'] ?? '').trim();
      const vehicle = VEHICLES.find((v) => v.toLowerCase() === vehicleRaw.toLowerCase()) ?? null;
      const statusRaw = (raw['position_status'] ?? '').trim();
      const status = POSITION_STATUSES.find((s) => s.toLowerCase() === statusRaw.toLowerCase()) ?? null;

      const ownershipRaw = (raw['ownership_pct'] ?? '').replace(/[%\s]/g, '');
      const ownership = ownershipRaw === '' ? null : Number(ownershipRaw);

      const payload: Record<string, unknown> = {
        portfolio_company_id: company?.id ?? null,
        sector: raw['sector']?.trim() || null,
        stage: raw['stage']?.trim() || null,
        vehicle: vehicle as PortfolioVehicle | null,
        position_status: (status ?? 'Active') as PositionStatus,
        first_investment_date: toDate(raw['first_investment_date'] ?? ''),
        last_investment_date: toDate(raw['last_investment_date'] ?? ''),
        current_fmv: toCents(raw['current_fmv'] ?? ''),
        realized_proceeds: toCents(raw['realized_proceeds'] ?? '') ?? 0,
        ownership_pct: ownership != null && Number.isFinite(ownership) ? ownership / 100 : null,
        notes: raw['notes']?.trim() || null,
      };

      let error: string | null = null;
      if (!companyName) error = 'Missing company_name';
      else if (!company) error = `No portfolio company named "${companyName}"`;
      else if (vehicleRaw && !vehicle) error = `Unknown vehicle "${vehicleRaw}"`;
      else if (statusRaw && !status) error = `Unknown position_status "${statusRaw}"`;

      return { companyName, companyId: company?.id ?? null, payload, error };
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
      const { error } = await supabase
        .from('portfolio_positions')
        .upsert(valid.map((r) => r.payload) as never, { onConflict: 'portfolio_company_id' });
      if (error) throw error;
      toast({
        title: 'Positions imported',
        description: `${valid.length} position${valid.length === 1 ? '' : 's'} saved.`,
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
          Import positions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import positions</DialogTitle>
          <DialogDescription>
            One row per portfolio company. Enter dollars (not cents) and ownership as a plain percentage (8.5 = 8.5%).
            Existing positions are updated in place.
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
          <p>{TEMPLATE_COLUMNS.join(', ')}</p>
          <p>Vehicle: {VEHICLES.join(' · ')}</p>
          <p>Position status: {POSITION_STATUSES.join(' · ')}</p>
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
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r, i) => (
                  <TableRow key={`${r.companyName}-${i}`}>
                    <TableCell className="whitespace-nowrap">{r.companyName || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {(r.payload.vehicle as string) ?? '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {r.payload.position_status as string}
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
