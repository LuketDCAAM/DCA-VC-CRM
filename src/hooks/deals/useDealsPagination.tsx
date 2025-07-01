
import { useState, useMemo } from 'react';
import { Deal } from '@/types/deal';

export type PageSize = 50 | 100 | 500 | 'all';

export function useDealsPagination(deals: Deal[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(100);

  const totalItems = deals.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);

  const paginatedDeals = useMemo(() => {
    if (pageSize === 'all') {
      return deals;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return deals.slice(startIndex, endIndex);
  }, [deals, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (newPageSize: PageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedDeals,
    handlePageChange,
    handlePageSizeChange,
  };
}
