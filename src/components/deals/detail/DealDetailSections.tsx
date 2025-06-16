
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { CallNotesManager } from '../CallNotesManager';
import { DealInvestorsManager } from '../DealInvestorsManager';
import { DealContactsManager } from '../DealContactsManager';
import { Deal } from '@/types/deal';

interface DealDetailSectionsProps {
  deal: Deal;
}

export function DealDetailSections({ deal }: DealDetailSectionsProps) {
  return (
    <>
      <div className="my-6">
        <Separator />
      </div>

      <CallNotesManager dealId={deal.id} />

      <div className="my-6">
        <Separator />
      </div>

      <DealInvestorsManager deal={deal} />

      <div className="my-6">
        <Separator />
      </div>

      <DealContactsManager deal={deal} />
    </>
  );
}
