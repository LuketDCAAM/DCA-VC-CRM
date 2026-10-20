// Match deals to an investor's stated focus. Deterministic scoring so suggestions are
// explainable and repeatable; the AI only writes the email prose around them.

import { getDealSectors } from '@/utils/sectorUtils';
import type { Deal } from '@/types/deal';
import type { Investor } from '@/types/investor';

export interface DealMatch {
  deal: Deal;
  score: number;
  reasons: string[];
  rationale: string;
}

const STAGE_NEIGHBOURS: Record<string, string[]> = {
  'Pre-Seed': ['Pre-Seed', 'Seed'],
  Seed: ['Pre-Seed', 'Seed', 'Series A'],
  'Series A': ['Seed', 'Series A', 'Series B'],
  'Series B': ['Series A', 'Series B', 'Series C'],
  'Series C': ['Series B', 'Series C', 'Growth'],
  Growth: ['Series C', 'Growth'],
  'Late Stage': ['Growth', 'Late Stage'],
};

function norm(v: string | null | undefined) {
  return (v || '').trim().toLowerCase();
}

export function scoreDealForInvestor(deal: Deal, investor: Investor): DealMatch {
  const reasons: string[] = [];
  let score = 0;

  const dealSectors = getDealSectors(deal);
  const prefs = (investor.preferred_sectors || []).map(norm);
  const sectorHit = dealSectors.filter((s) => prefs.includes(norm(s)));
  if (sectorHit.length) {
    score += 40;
    reasons.push(`Focus match on ${sectorHit.join(', ')}`);
  }

  const investorStage = investor.preferred_investment_stage as string | null;
  const dealStage = deal.round_stage as string | null;
  if (investorStage && dealStage) {
    if (norm(investorStage) === norm(dealStage)) {
      score += 30;
      reasons.push(`${dealStage} matches their stage`);
    } else if ((STAGE_NEIGHBOURS[investorStage] || []).includes(dealStage)) {
      score += 15;
      reasons.push(`${dealStage} is adjacent to their stage`);
    }
  }

  if (investor.average_check_size && deal.round_size) {
    const check = Number(investor.average_check_size);
    const round = Number(deal.round_size);
    if (check <= round) {
      score += 15;
      reasons.push('Their typical check fits the round');
    }
  }

  const invLoc = norm(investor.city || investor.location);
  const dealLoc = norm(deal.city || deal.headquarters_location || deal.location);
  if (invLoc && dealLoc && (invLoc === dealLoc || norm(investor.country) === norm(deal.country))) {
    score += 8;
    reasons.push('Same geography');
  }

  if (deal.deal_score && deal.deal_score > 0) score += Math.min(deal.deal_score / 10, 10);
  if (deal.is_priority_deal) score += 5;

  const rationale = reasons.length ? reasons.join('; ') : 'Strong deal from this month, worth a look';
  return { deal, score, reasons, rationale };
}

export function suggestDealsForInvestor(deals: Deal[], investor: Investor, count = 4): DealMatch[] {
  return deals
    .map((d) => scoreDealForInvestor(d, investor))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// ---------- Deal-first matching: rank investors for a set of deals ----------

export interface InvestorMatch {
  investor: Investor;
  /** Best fit score across the selected deals. */
  score: number;
  /** Deals that fit this investor, best first (capped). */
  deals: { deal: Deal; score: number; reasons: string[]; rationale: string }[];
  /** True when every selected deal was already sent to / linked with this investor. */
  alreadySent: boolean;
}

/** Fit of an investor for one deal (deal quality bonuses excluded so ranking is about fit). */
export function scoreInvestorForDeal(deal: Deal, investor: Investor) {
  const m = scoreDealForInvestor({ ...deal, deal_score: null, is_priority_deal: false } as Deal, investor);
  return { deal, score: Math.round(m.score), reasons: m.reasons, rationale: m.rationale };
}

/**
 * Rank investors for the selected deals.
 * `sentPairs` holds `${dealId}:${investorId}` keys for deals already sent or linked.
 */
export function matchInvestorsForDeals(
  deals: Deal[],
  investors: Investor[],
  opts: { sentPairs?: Set<string>; minScore?: number; maxDealsPerInvestor?: number; includeSent?: boolean } = {},
): InvestorMatch[] {
  const { sentPairs = new Set(), minScore = 1, maxDealsPerInvestor = 4, includeSent = false } = opts;
  const out: InvestorMatch[] = [];
  for (const investor of investors) {
    const all = deals.map((d) => ({ ...scoreInvestorForDeal(d, investor), sent: sentPairs.has(`${d.id}:${investor.id}`) }));
    const fits = all
      .filter((m) => m.score >= minScore && (includeSent || !m.sent))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDealsPerInvestor);
    if (!fits.length) continue;
    out.push({
      investor,
      score: fits[0].score,
      deals: fits.map(({ sent: _s, ...m }) => m),
      alreadySent: all.every((m) => m.sent),
    });
  }
  return out.sort((a, b) => b.score - a.score || b.deals.length - a.deals.length);
}
