import React from 'react';
import { ConfigurableDealsTable } from '@/components/deals/ConfigurableDealsTable';

const mk = (i: number) =>
  ({
    id: `id-${i}`,
    company_name:
      i % 3 === 0
        ? 'Northbridge Applied Robotics & Autonomous Systems Holdings Limited'
        : `Company ${i}`,
    website: i % 2 === 0 ? 'https://example-some-very-long-domain-name.co.uk' : null,
    linkedin_url: i % 4 === 0 ? 'https://www.linkedin.com/company/some-quite-long-company-slug' : null,
    description:
      i % 2 === 0
        ? 'A developer tools platform for data teams that need to build, test and deploy pipelines without writing infrastructure code, currently serving 40 design partners.'
        : 'Short note',
    contact_name: i % 5 === 0 ? 'Alexandrina Konstantinopoulos' : `Contact ${i}`,
    contact_email: i % 2 === 0 ? 'a.very.long.email.address@example-domain.com' : null,
    contact_phone: i % 3 === 0 ? '+1 (416) 555-0142' : null,
    pipeline_stage: 'Screening',
    round_stage: 'Series A',
    investment_vehicle: 'SAFE Note',
    round_size: 400000000 + i * 10000000,
    post_money_valuation: 2400000000,
    revenue: 120000000,
    deal_score: 70 + (i % 30),
    deal_source: 'Warm Intro',
    sector: 'AI; Healthcare; Developer Tools; Climate',
    location: 'San Francisco, California, United States',
    city: 'San Francisco',
    state_province: 'California',
    country: 'United States',
    sourced_by: 'Christopher Wainwright',
    created_at: '2026-01-14T10:00:00Z',
    last_call_date: '2026-02-02',
    total_calls: 3,
    updated_at: '2026-02-02T10:00:00Z',
  }) as any;

const deals = Array.from({ length: 12 }, (_, i) => mk(i));

export default function PreviewRows() {
  return (
    <div className="p-6">
      <ConfigurableDealsTable
        deals={deals}
        onViewDetails={() => {}}
        selectedDeals={[]}
        onToggleDealSelection={() => {}}
        onSelectAll={() => {}}
        onDeselectAll={() => {}}
        isAllSelected={false}
      />
    </div>
  );
}
