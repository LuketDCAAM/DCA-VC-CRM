import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  POSITION_STATUSES,
  VEHICLES,
  type PortfolioPosition,
  type PortfolioVehicle,
  type PositionStatus,
} from '@/hooks/portfolio/usePortfolioPositions';

interface Props {
  companyId: string;
  position: PortfolioPosition | null;
  saving: boolean;
  onSave: (
    companyId: string,
    values: Partial<Omit<PortfolioPosition, 'id' | 'portfolio_company_id' | 'updated_at'>>,
  ) => Promise<boolean>;
}

const NONE = '__none__';

export function PositionDetailsForm({ companyId, position, saving, onSave }: Props) {
  const [sector, setSector] = useState(position?.sector ?? '');
  const [stage, setStage] = useState(position?.stage ?? '');
  const [vehicle, setVehicle] = useState<string>(position?.vehicle ?? NONE);
  const [status, setStatus] = useState<PositionStatus>(position?.position_status ?? 'Active');
  const [firstDate, setFirstDate] = useState(position?.first_investment_date ?? '');
  const [lastDate, setLastDate] = useState(position?.last_investment_date ?? '');
  const [fmv, setFmv] = useState(position?.current_fmv != null ? String(position.current_fmv / 100) : '');
  const [realized, setRealized] = useState(
    position?.realized_proceeds ? String(position.realized_proceeds / 100) : '',
  );
  const [ownership, setOwnership] = useState(
    position?.ownership_pct != null ? String(position.ownership_pct * 100) : '',
  );
  const [notes, setNotes] = useState(position?.notes ?? '');

  const toCents = (v: string) => {
    const n = Number(v.replace(/[$,\s]/g, ''));
    return v.trim() === '' || !Number.isFinite(n) ? null : Math.round(n * 100);
  };

  const submit = () =>
    onSave(companyId, {
      sector: sector.trim() || null,
      stage: stage.trim() || null,
      vehicle: vehicle === NONE ? null : (vehicle as PortfolioVehicle),
      position_status: status,
      first_investment_date: firstDate || null,
      last_investment_date: lastDate || null,
      current_fmv: toCents(fmv),
      realized_proceeds: toCents(realized) ?? 0,
      ownership_pct: ownership.trim() === '' ? null : Number(ownership) / 100,
      notes: notes.trim() || null,
    });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Position details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Sector</Label>
            <Input value={sector} onChange={(e) => setSector(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Stage at entry</Label>
            <Input value={stage} onChange={(e) => setStage(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Vehicle</Label>
            <Select value={vehicle} onValueChange={setVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {VEHICLES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Position status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PositionStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">First investment</Label>
            <Input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Last investment</Label>
            <Input type="date" value={lastDate} onChange={(e) => setLastDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Current FMV ($)</Label>
            <Input inputMode="decimal" value={fmv} onChange={(e) => setFmv(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Realized proceeds ($)</Label>
            <Input inputMode="decimal" value={realized} onChange={(e) => setRealized(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Ownership (%)</Label>
            <Input inputMode="decimal" value={ownership} onChange={(e) => setOwnership(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Save position'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
