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
