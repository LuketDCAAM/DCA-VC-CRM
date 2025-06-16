
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Deal } from '@/types/deal';
import { DealCard } from '@/components/deals/DealCard';

interface VirtualizedDealListProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  height?: number;
  itemHeight?: number;
}

interface ItemData {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
}

const DealItem = ({ index, style, data }: { index: number; style: React.CSSProperties; data: ItemData }) => {
  const { deals, onViewDetails } = data;
  const deal = deals[index];

  if (!deal) return null;

  return (
    <div style={style} className="px-2 py-1">
      <DealCard deal={deal} onViewDetails={onViewDetails} />
    </div>
  );
};

export function VirtualizedDealList({ 
  deals, 
  onViewDetails, 
  height = 600,
  itemHeight = 280 
}: VirtualizedDealListProps) {
  const itemData = useMemo(() => ({
    deals,
    onViewDetails
  }), [deals, onViewDetails]);

  if (deals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No deals found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <List
        height={height}
        width="100%"
        itemCount={deals.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5}
      >
        {DealItem}
      </List>
    </div>
  );
}
