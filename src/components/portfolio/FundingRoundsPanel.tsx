import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Plus, Trash2, TrendingUp } from 'lucide-react';
import { usePortcoRounds, type PortcoRound } from '@/hooks/portfolio/usePortcoRounds';
import { buildRoundChain } from '@/lib/portfolio/timeseries';
import { formatMoney, formatMultiple, formatNumber } from '@/lib/portfolio/metrics';
import { RoundFormDialog } from './RoundFormDialog';

interface Props {
  companyId: string;
}

function ppsLabel(cents: number | null) {
  if (cents == null) return '—';
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
}

export function FundingRoundsPanel({ companyId }: Props) {
  const { rounds, loading, saving, saveRound, deleteRound } = usePortcoRounds(companyId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PortcoRound | null>(null);

  const chain = useMemo(() => buildRoundChain(rounds), [rounds]);
  const latest = chain[chain.length - 1];
  const entryRound = chain.find((c) => c.round.we_participated);
  const totalStepUp =
    latest && entryRound && latest.round.id !== entryRound.round.id
      ? latest.stepUpVsEntry ?? latest.cumulativeStepUp
      : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Round history &amp; step-ups
          </CardTitle>
          <CardDescription>
            Every financing round on record. Step-ups compare price per share round over round, falling back to
            post-money when share price is unknown.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add round
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalStepUp != null && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Step-up since our entry</p>
              <p className="text-xl font-semibold">{formatMultiple(totalStepUp)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Latest round</p>
              <p className="text-xl font-semibold">{latest?.round.round_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Latest post-money</p>
              <p className="text-xl font-semibold">{formatMoney(latest?.round.post_money_valuation ?? null)}</p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading rounds…</p>
        ) : !chain.length ? (
          <p className="text-sm text-muted-foreground">
            No rounds recorded yet. Add each round with its price per share to track step-ups over time.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Post-money</TableHead>
                  <TableHead className="text-right">Price / share</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="text-right">Step-up</TableHead>
                  <TableHead className="text-right">Vs. entry</TableHead>
                  <TableHead className="text-right">Months</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead className="text-right">Our check</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {chain.map((link) => (
                  <TableRow key={link.round.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {link.round.round_name}
                      {!link.round.we_participated && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          no participation
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {link.round.close_date ? new Date(link.round.close_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(link.round.post_money_valuation)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{ppsLabel(link.round.price_per_share)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(link.round.amount_raised)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {link.stepUp == null ? (
                        '—'
                      ) : (
                        <span className={link.stepUp >= 1 ? 'text-emerald-600' : 'text-destructive'}>
                          {formatMultiple(link.stepUp)}
                          {link.stepUpBasis === 'post_money' && <span className="text-[10px] ml-1">(val)</span>}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMultiple(link.stepUpVsEntry)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {link.monthsSincePrior == null ? '—' : link.monthsSincePrior.toFixed(0)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{link.round.lead_investor ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(link.round.our_amount)}
                      {link.round.our_shares != null && (
                        <span className="block text-[10px] text-muted-foreground">
                          {formatNumber(link.round.our_shares)} sh
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditing(link.round);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {link.round.round_name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the round and its step-up history. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void deleteRound(link.round.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {formOpen && (
        <RoundFormDialog
          key={editing?.id ?? 'new'}
          open={formOpen}
          onOpenChange={setFormOpen}
          round={editing}
          saving={saving}
          onSave={saveRound}
        />
      )}
    </Card>
  );
}
